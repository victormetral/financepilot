import express from "express"

import {
  getTransactions,
  getTransactionById,
  postTransaction,
  putTransaction,
  deleteTransactionById,
} from "../controllers/transaction.controller.js"

const router = express.Router()

router.get("/", getTransactions)

router.get("/:id", getTransactionById)

router.post("/", postTransaction)

router.put("/:id", putTransaction)

router.delete("/:id", deleteTransactionById)

export default router