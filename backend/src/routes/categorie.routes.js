import { Router } from "express"

import {
  getCategories,
  getCategorieById,
  postCategorie,
  putCategorie,
  removeCategorie,
} from "../controllers/categorie.controller.js"

const router = Router()

router.get("/", getCategories)
router.get("/:id", getCategorieById)
router.post("/", postCategorie)
router.put("/:id", putCategorie)
router.delete("/:id", removeCategorie)

export default router