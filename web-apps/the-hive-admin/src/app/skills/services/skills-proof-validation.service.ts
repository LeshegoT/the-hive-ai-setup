import { Injectable } from "@angular/core";
import { SharedService } from "../../services/shared.service";
import { Observable } from "rxjs";
import { Guid, PendingProofValidation, Staff } from "@the-hive/lib-skills-shared";

@Injectable({
  providedIn: 'root'
})
export class ProofValidationService {
  constructor(private readonly sharedService: SharedService) {}

  getPendingProofValidations(
    pageIndex: number,
    pageSize: number,
    sortedColumn?: string,
    sortOrder?: string,
    searchText?: string,
  ): Observable<{ data: PendingProofValidation[]; totalCount: number }> {
    const queryParams = {
      pageLength: pageSize.toString(),
      startIndex: pageIndex.toString(),
       ...(searchText && { searchText}),
      ...(sortedColumn && { sortedColumn }),
      ...(sortOrder && { sortOrder }),
    }               

    const searchParams = new URLSearchParams(queryParams);
    return this.sharedService.get(`skills/proofValidation/?${searchParams.toString()}`);
  }

  updateProofValidationApproved (
    qualificationHasEdgeGuid: Guid,
  ): Observable<string>{
    
    return this.sharedService.patch(`skills/proofValidation/${qualificationHasEdgeGuid}`, {});
  }

  updateProofValidationRejected(
    guidOfEdgeRequiringValidation: Guid,
    staffDisplayName: string, 
    staffUpn: Staff['upn'], 
    rejectedProof: string,
    rejectedProofFileName: string,
  ): Observable<string>{
    return this.sharedService.delete(`skills/proofValidation/${guidOfEdgeRequiringValidation}?displayName=${staffDisplayName}&staffUpn=${staffUpn}&rejectedProof=${rejectedProof}&rejectedProofFileName=${rejectedProofFileName}`);
  }

}
