const express = require("express");
const router = express.Router();
const controller = require("./enseignants.controller");

router.get("/", controller.getAll);
router.get("/add", controller.showAddForm);
router.post("/add", controller.add);
router.get("/view/:id", controller.view);
router.get("/edit/:id", controller.showEditForm);
router.post("/edit/:id", controller.update);
router.get("/delete/:id", controller.delete);

module.exports = router;
