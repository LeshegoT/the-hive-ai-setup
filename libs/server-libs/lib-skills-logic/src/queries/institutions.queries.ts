import { SqlRequest } from "@the-hive/lib-db";
import { Pagination } from "@the-hive/lib-shared";
import { Attribute, Guid, Institution, InstitutionType, StandardizedName } from "@the-hive/lib-skills-shared";
import gremlin from "gremlin";

export class InstitutionDatabase {
  db: () => Promise<SqlRequest>;
  gremlin: gremlin.driver.Client;

  constructor(db: () => Promise<SqlRequest>, gremlin: gremlin.driver.Client) {
    this.db = db;
    this.gremlin = gremlin;
  }

  async addInstitutionToGraph(standardizedName: string): Promise<Guid> {
    const query = `
      g.V().has('identifier', 'new-institution').as('parent')
        .addV('tag').property('identifier', standardizedName).as('child')
        .addE('is-a').from('child').to('parent')
        .select('child')
        .id()
    `;
    const obj = {
      standardizedName,
    };
    const result = await this.gremlin.submit(query, obj);
    return result._items[0];
  }

  createRatifiedFilterQuery(ratified: boolean | undefined) {
    if (ratified === undefined) {
      return "";
    } else if (!ratified) {
      return `.where(
                __.or(
                  outE().has('needs-ratification', true),
                  outE('is-a').inV().hasLabel('new')
                )
              )`;
    } else {
      return `.where(
                __.and(
                __.not(outE().has('needs-ratification', true)),
                __.not(outE('is-a').inV().hasLabel('new')))

              )`;
    }
  }

  createInstitutionTypesFilterQuery(institutionTypesToInclude: InstitutionType[] | undefined) {
    if (institutionTypesToInclude && institutionTypesToInclude.length > 0) {
      return `.where(__.repeat(out().simplePath()).emit().has('identifier', within(institutionTypesToInclude)))`;
    } else {
      return "";
    }
  }

  createOffersFilterQuery(): string  {
    return `.where(
      __.inE('available-at')
        .outV()
        .hasLabel('attribute')
        .has('identifier', attributeOffered)
    )`;
  }

  async getInstitutions(
    gremlin: gremlin.driver.Client,
    standardizedNames: StandardizedName[],
    pagination: Pagination,
    ratified: boolean | undefined,
    institutionTypesToInclude: InstitutionType[] | undefined,
    attributeOffered?: StandardizedName
  ): Promise<Partial<Institution[]>> {
    const pageLength = pagination.pageLength;
    const startIndex = pagination.startIndex * pageLength;
    const endIndex = startIndex + pageLength;

    const institutionTypesFilterQuery = this.createInstitutionTypesFilterQuery(institutionTypesToInclude);
    const ratifiedFilterQuery = this.createRatifiedFilterQuery(ratified);
    const attributeFilterQuery = attributeOffered ? this.createOffersFilterQuery() : undefined;

    const query = `
        g.V().has('identifier', within(standardizedNames))
         ${attributeFilterQuery ? attributeFilterQuery : ''}
         ${institutionTypesFilterQuery}
         ${ratifiedFilterQuery}
        .range(startIndex, endIndex)
        .project('canonicalNameGuid', 'standardizedName','institutionType','needsRatification')
        .by(id())
        .by(values('identifier'))
        .by(outE('is-a').inV().values('identifier'))
        .by(
         choose(
           __.or(
          outE().has('needs-ratification', true),
          outE('is-a').inV().hasLabel('new')
          ),
          constant(true),
          constant(false)
          ))
      `;

    const input = {
      institutionTypesToInclude,
      standardizedNames,
      startIndex,
      endIndex,
      attributeOffered
    };
    const result = await gremlin.submit(query, input);
    return result._items;
  }

  async getInstitutionsThatOfferAttribute(
    gremlin: gremlin.driver.Client,
    attribute: StandardizedName,
    ratified: boolean | undefined,
    institutionTypesToInclude: InstitutionType[] | undefined,
  ): Promise<Partial<Institution[]>> {

    const institutionTypesFilterQuery = this.createInstitutionTypesFilterQuery(institutionTypesToInclude);
    const ratifiedFilterQuery = this.createRatifiedFilterQuery(ratified);

    const needsRatificationProjection = `
      choose(
        __.or(
          outE().has('needs-ratification', true),
          outE('is-a').inV().hasLabel('new')
        ),
        constant(true),
        constant(false)
      )
    `;

    const projectionWithInstitutionType = `
      project('canonicalNameGuid', 'standardizedName', 'institutionType', 'needsRatification')
          .by(id())
          .by(values('identifier'))
          .by(outE('is-a').inV().values('identifier'))
          .by(${needsRatificationProjection})
    `;

    const projectionWithoutInstitutionType = `
      project('canonicalNameGuid', 'standardizedName', 'needsRatification')
          .by(id())
          .by(values('identifier'))
          .by(${needsRatificationProjection})
    `;

    const query = `
      g.V().has('attribute','identifier',attribute)
      .out('available-at')
      ${institutionTypesFilterQuery}
      ${ratifiedFilterQuery}
      .choose(
        outE('is-a').inV().not(__.or(__.hasLabel('topLevelTag'), __.hasLabel('new'))),
        ${projectionWithInstitutionType},
        ${projectionWithoutInstitutionType}
      )
    `;

    const input = {
      institutionTypesToInclude,
      attribute
    };
    const result = await gremlin.submit(query, input);
    return result._items;
  }

  async retrieveInstitution(
    gremlin: gremlin.driver.Client,
    standardizedName: StandardizedName,
  ): Promise<Partial<Institution>> {
    const gremlinProjectionKeys = "'canonicalNameGuid', 'standardizedName', 'needsRatification'";
    const gremlinProjectionValues = `
      .by(id())
      .by(values('identifier'))
      .by(
        choose(
          or(
            outE().has('needs-ratification', true),
            out('is-a').hasLabel('new')
          ),
          constant(true),
          constant(false)
        )
      )
    `;

    const query = `
        g.V()
          .has('identifier', standardizedName)
          .as('selection')
          .repeat(out('is-a')).until(outE().count().is(0))
          .has('identifier', 'institution')
          .select('selection')
          .choose(
            out('is-a').values('identifier').is(without('new-institution', 'institution')),
            project(${gremlinProjectionKeys}, 'institutionType')
              ${gremlinProjectionValues}
              .by(out('is-a').values('identifier')),
            project(${gremlinProjectionKeys})
              ${gremlinProjectionValues}
          )
      `;

    const input = {
      standardizedName
    };
    const result = await gremlin.submit(query, input);
    return result._items[0];
  }

  async getInstitutionTypes(standardizedName: string): Promise<InstitutionType[]> {
    const query = `
      g.V().has('identifier', standardizedName).out('is-a').values('identifier')
    `;
    const obj = {
      standardizedName,
    };
    const result = await this.gremlin.submit(query, obj);
    return result._items;
  }

  async makeAttributeAvailableAtInstitution(institutionCanonicalNameGuid: Guid, attribute: Attribute): Promise<Attribute> {
    const query = `
      g.V().hasId(attributeCanonicalNameGuid)
      .coalesce(
        outE('available-at').where(inV().hasId(institutionCanonicalNameGuid)).id(),
        addE('available-at')
          .to(g.V().hasId(institutionCanonicalNameGuid))
          .property('needs-ratification', true)
          .id()
      )
    `;
    const input = {
      institutionCanonicalNameGuid,
      attributeCanonicalNameGuid: attribute.canonicalNameGuid
    };
    const result = await this.gremlin.submit(query, input);
    return result._items[0];
  }

  async markNeedsRatificationAsFalseForAttributeAvailableAtInstitution(attributeStandardizedName: StandardizedName, institutionStandardizedNames: StandardizedName[]): Promise<void> {
    const query = `
      g.V().has('identifier', within(institutionStandardizedNames))
        .inE('available-at')
        .where(outV().has('identifier', attributeStandardizedName))
        .property('needs-ratification', false)
    `;

    const input = {
      attributeStandardizedName,
      institutionStandardizedNames
    };

    await this.gremlin.submit(query, input);
  }
}

