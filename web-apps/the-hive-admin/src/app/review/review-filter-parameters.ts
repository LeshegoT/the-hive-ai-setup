export interface ReviewFilterParameters {
  statusId: number;
  createdBy: string;
  from: Date;
  to: Date;
  searchText: string;
  archived: boolean;
  selectedReviewTypeIds: number[];
  selectedStatusIds: number[];
}
