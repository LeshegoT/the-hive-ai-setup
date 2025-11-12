import { Attribute, AttributeForSearchTextException, Tag } from '@the-hive/lib-skills-shared';

export function findAttributesForSearchTextException(
  searchTextExceptions: AttributeForSearchTextException[],
  searchText: string
): Attribute[] {

  const matchesSearchText = (searchTextException: AttributeForSearchTextException): boolean =>
    searchTextException.searchTextException.toLowerCase().includes(searchText.toLowerCase());

  const sortByCanonicalName = (a: Attribute, b: Attribute): number => a.canonicalName.localeCompare(b.canonicalName);

  const reduceAttributesToBeUniqueByStandardizedName = (
    uniqueAttributes: Attribute[],
    candidateAttribute: Attribute
  ): Attribute[] =>
    uniqueAttributes.some(attribute => attribute.standardizedName === candidateAttribute.standardizedName)
      ? uniqueAttributes
      : [...uniqueAttributes, candidateAttribute];

  return searchTextExceptions
    .filter(matchesSearchText)
    .map(searchTextException => searchTextException.attribute)
    .sort(sortByCanonicalName)
    .reduce(reduceAttributesToBeUniqueByStandardizedName, []);
}

const areSkillPathTagsEqual = (a: Tag, b: Tag): boolean =>  a.standardizedName === b.standardizedName;

export function splitIntoSkillPaths(flattenedSkillPaths: Tag[], firstSkillPathTag: Tag): Tag[][] {
  return flattenedSkillPaths.reduce<Tag[][]>((skillPathGroups, skillPathTag) => {
    const lastSkillPathGroup = skillPathGroups.at(-1);

    if (skillPathTag.standardizedName === firstSkillPathTag.standardizedName) {
      return (skillPathGroups.push([skillPathTag]), skillPathGroups);
    } else if (lastSkillPathGroup) {
      return (lastSkillPathGroup.push(skillPathTag), skillPathGroups);
    } else {
      return skillPathGroups;
    }
  }, []);
}

function findCommonSkillPathPrefix(skillPaths: Tag[][]): Tag[] {
  return skillPaths.length === 0 ? [] :
    skillPaths[0].reduce<Tag[]>((commonSkillPathPrefix, skillPathTag, index) =>{ 
      const isEverySkillPathTagEqual = skillPaths.every(skillPath => areSkillPathTagsEqual(skillPath[index], skillPathTag));
      return  commonSkillPathPrefix.length === index && isEverySkillPathTagEqual
        ? [...commonSkillPathPrefix, skillPathTag]
        : commonSkillPathPrefix
    }, []);
}

function findCommonSkillPathSuffix(skillPaths: Tag[][]): Tag[] {
  const reversedSkillPaths = skillPaths.map(skillPath => [...skillPath].reverse());
  return findCommonSkillPathPrefix(reversedSkillPaths).reverse();
}

const filterInElements = (
  skillPath: Tag[],
  shouldIncludeElement: (index: number, length: number) => boolean
): Tag[] => skillPath.filter((_, index) => shouldIncludeElement(index, skillPath.length));

const getMiddleSections = (
  skillPaths: Tag[][], 
  commonSkillPathPrefix: Tag[], 
  commonSkillPathSuffix: Tag[]
): Tag[][] => 
  skillPaths.map(skillPath => 
    filterInElements(skillPath, (index, length) => 
      index >= commonSkillPathPrefix.length && index < length - commonSkillPathSuffix.length)
  );

const mergeMiddleSectionOfSkillPaths = (skillPathsMiddleSections: Tag[][]): string[] =>
  skillPathsMiddleSections.map(skillPathsMiddleSection => skillPathsMiddleSection.map(skillPathTag => skillPathTag.canonicalName).join(', '));

const collectCanonicalNamesOfSkillPaths = (skillPath: Tag[], skillPathTagsToFilterOut: Tag[]): string[] =>
  skillPath.reduce<string[]>((canonicalNames, skillPathTag) => {
    return skillPathTagsToFilterOut.some(skillPathTagToExclude => skillPathTag.standardizedName === skillPathTagToExclude.standardizedName) ?
      canonicalNames : [...canonicalNames, skillPathTag.canonicalName]
  }, []);

function getMiddleSegmentOfSkillPaths(
  skillPaths: Tag[][],
  skillPathPrefix: Tag[],
  skillPathSuffix: Tag[],
  hasTooManyPaths: boolean,
  doPathsSplitBeforeShortestPathEnds: boolean
): string | undefined {
  if (hasTooManyPaths && doPathsSplitBeforeShortestPathEnds) {
    return '...';
  } else{
    const middleSections = getMiddleSections(skillPaths, skillPathPrefix, skillPathSuffix);
    const areAllMiddleSectionsEmpty = middleSections.every(middleSection => !middleSection.length);
    const isOnlyOneMiddleSection = middleSections.length === 1;
    return areAllMiddleSectionsEmpty || isOnlyOneMiddleSection ? 
      undefined : mergeMiddleSectionOfSkillPaths(middleSections).join(' and ');
  }
}

export const mergeSkillPaths = (startSkillPath: Tag, skillPaths: Tag[][], maximumMergablePaths: number): string => {
  const [firstSkillPath, secondSkillPath] = skillPaths;
  if (!firstSkillPath){ 
    return '';
  } else if (!secondSkillPath){ 
    return `(${collectCanonicalNamesOfSkillPaths(firstSkillPath, [startSkillPath]).join(', ')})`;
  } else{
    const shortestSkillPathLength = Math.min(...skillPaths.map(skillPath => skillPath.length));
    const commonSkillPathPrefix = findCommonSkillPathPrefix(skillPaths);
    const commonSkillPathSuffix = findCommonSkillPathSuffix(skillPaths);
    const longestSuffixLength = shortestSkillPathLength - commonSkillPathPrefix.length;
    const longestCommonSkillPathSuffix = filterInElements(commonSkillPathSuffix, (index, suffixLength) => index >= suffixLength - longestSuffixLength);
    const hasTooManyPaths = skillPaths.length > maximumMergablePaths;
    const doPathsSplitBeforeShortestPathEnds = commonSkillPathPrefix.length < shortestSkillPathLength;
    const mergedMiddleSkillPathsSegments = getMiddleSegmentOfSkillPaths(
      skillPaths, 
      commonSkillPathPrefix, 
      longestCommonSkillPathSuffix, 
      hasTooManyPaths, 
      doPathsSplitBeforeShortestPathEnds);

    return `(${[
      ...collectCanonicalNamesOfSkillPaths(commonSkillPathPrefix, [startSkillPath]),
      ...(mergedMiddleSkillPathsSegments ? [mergedMiddleSkillPathsSegments] : []),
      ...collectCanonicalNamesOfSkillPaths(longestCommonSkillPathSuffix, [])
    ].join(', ')})`;
  }
};