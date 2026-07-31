import express from "express"

import {
  getBudgets,
  getBudgetById,
  postBudget,
  putBudget,
  deleteBudgetById,
} from "../controllers/budget.controller.js"

const router = express.Router()

router.get("/", getBudgets)

router.get("/:id", getBudgetById)

router.post("/", postBudget)

router.put("/:id", putBudget)

router.delete("/:id", deleteBudgetById)

export default router