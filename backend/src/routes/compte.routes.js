import { Router } from "express"

import {
  getComptes,
  getCompteById,
  postCompte,
  putCompte,
} from "../controllers/compte.controller.js"

const router = Router()

router.get("/", getComptes)
router.get("/:id", getCompteById)
router.post("/", postCompte)
router.put("/:id", putCompte)

export default router