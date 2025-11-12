import { handleErrors } from '@the-hive/lib-core';
import type { Request, Response } from 'express';
import { Router } from 'express';
import { getAllReviews, getAllStaffOverview } from '../queries/staff-overview.queries';

type StaffOverviewQuery = {searchText: string, staffFilter: unknown, unit:unknown , entityFilters:unknown};

type StaffOverview = {
  staffId: number,
  displayName: string,
  userPrincipleName:string,
  department: string,
  joinedDate:Date,
  staffType:unknown,
  nextFeedbackType: string,
  nextReviewDate: string,
  staffReviewId: number,
  currentFeedbackType: string,
  currentReviewDate: string,
  currentStaffReviewId: number,
  manager: string,
  entity: string
}

const router = Router();

router.get(
  '/staff-overview/',
  handleErrors(async (req: Request<StaffOverviewQuery,StaffOverview[]>, res: Response<StaffOverview[]>) => {
    try {
      const { searchText, staffFilter, unit , entityFilters } = req.query;
      const allStaffOverview = await getAllStaffOverview(
        searchText,
        staffFilter,
        unit,
        entityFilters
      );
      res.json(allStaffOverview);
    } catch (error) {
      let errorMessage = error.message;
      if (error.causedBy) {
        errorMessage = `${errorMessage}: caused by (${error.causedBy})`;
      }
      res.status(500).send(errorMessage);
    }
  })
);

router.get(
  '/staff-overview/reviews/:staffId',
  handleErrors(async (req: Request<{staffId: number}, StaffOverview>, res: Response<StaffOverview>) => {
    const allReviews = await getAllReviews(req.params.staffId);
    res.json(allReviews);
  })
);

module.exports = router;
