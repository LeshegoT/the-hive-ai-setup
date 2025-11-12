import { CountryFilter } from "../shared/interfaces";

export interface UpcomingReviewsFilterParameters {
    searchText?: string;
    selectedReviewTypeIds?: number[];
    date? : string;
    hrRep?: string;
    selectedCompanyFilter?: number[];
}
