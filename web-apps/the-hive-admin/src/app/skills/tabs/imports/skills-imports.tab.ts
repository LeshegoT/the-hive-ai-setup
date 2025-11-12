/**@format */
import { ChangeDetectorRef, Component } from "@angular/core";
import { CanonicalNameUpdateCounts, DuplicateEdge } from "@the-hive/lib-skills-shared";
import { SkillsService } from "../../services/skills.service";

@Component({
    selector: 'app-skills-imports',
    templateUrl: './skills-imports.tab.html',
    styleUrls: ['./skills-imports.tab.css'],
    standalone: false
})
export class SkillsImportsComponent{
  standardizeFieldsResponseMessage = "";
  canonicalNamesResponseMessage = "";
  removeDuplicateEdgesMessage = "";
   standardizedFields: { failedToStandardize?: string[]; standardized?: string[] } = {}
   updatedCanonicalNameGuids: CanonicalNameUpdateCounts = {};
   removedDuplicateEdges: {edgesRemoved?:DuplicateEdge[], failedEdgeRemovals?:DuplicateEdge[]} = {}

  constructor(private readonly skillsService: SkillsService, private changeDetectorReference: ChangeDetectorRef) {}

  updateRequiredFields() {
    this.standardizedFields= undefined;
    this.standardizeFieldsResponseMessage = "";

    this.skillsService.standardizeFields().subscribe({
      next: (data) => {
        const updatedFields = data.standardized;
        const failedToUpdateFields = data.failedToStandardize;
        if (updatedFields.length === 0 && failedToUpdateFields.length === 0) {
          this.standardizeFieldsResponseMessage = "All fields have already been standardized";
        } else if (updatedFields.length > 0 && failedToUpdateFields.length > 0) {
          this.standardizeFieldsResponseMessage = `Successfully standardized : ${updatedFields.join(
            ",",
          )}. Failed to standardize : ${failedToUpdateFields.join("")}`;
        } else if (failedToUpdateFields.length > 0) {
          this.standardizeFieldsResponseMessage = `Failed to standardize all fields ${failedToUpdateFields.join(",")}`;
        } else {
          this.standardizeFieldsResponseMessage = "Successfully updated all fields";
        }
        this.standardizedFields= data;
      },
      error: (error) => {
        this.standardizeFieldsResponseMessage = `Failed to standardize all fields: ${error.standardizeFieldsResponseMessage}`;
      },
      complete :()=>{
         this.changeDetectorReference.detectChanges()
         this.standardizedFields = {}
      }
    });
  }

  updateCanonicalNameGuids(): void {
    this.updatedCanonicalNameGuids = undefined
    this.canonicalNamesResponseMessage = "";
    this.skillsService.updateCanonicalNameGuidAndStandardizedNames().subscribe({
      next: (data) => {
        this.canonicalNamesResponseMessage = `Canonical names updated successfully: ${data.updatedCanonicalNameGuids.length}.\n Failed to update canonical names: ${data.failedUpdatedCanonicalNameGuids.length}`;
        this.updatedCanonicalNameGuids = data;
      },
      error: (updateError) => {
        this.canonicalNamesResponseMessage = `Failed to retrieve canonical names: ${updateError.message || updateError}`;
    this.changeDetectorReference.detectChanges();
      },
      complete: () => {
        this.changeDetectorReference.detectChanges();
        this.updatedCanonicalNameGuids = {};
      }
    });
  };

  removeDuplicateEdges(): void {
    this.removedDuplicateEdges = undefined;
    this.skillsService.removeDuplicateEdges().subscribe({
      next: (data) => {
        this.removeDuplicateEdgesMessage = `Duplications removed: ${data.edgesRemoved.length}.\n Failed duplication removals: ${data.failedEdgeRemovals.length}`;
        this.removedDuplicateEdges = data;
      },
      error: (updateError) => {
        this.removeDuplicateEdgesMessage = `Failed to rremove duplicate edges: ${updateError.message || updateError}`;
        this.changeDetectorReference.detectChanges();
      }, complete: () => {
        this.changeDetectorReference.detectChanges();
        this.removedDuplicateEdges = {};
      }
    });
  }
}
