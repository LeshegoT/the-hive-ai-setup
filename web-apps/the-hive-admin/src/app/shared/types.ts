import { ReviewStatus } from "@the-hive/lib-reviews-shared";

export type StatusReviewsCounts = {
    [k in ReviewStatus]?: number;
}
