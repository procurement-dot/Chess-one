const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { requireAuth } = require("../middleware/auth.middleware");

// Require authentication for user listing
router.use(requireAuth);

router.get("/", userController.getUsers);
router.get("/online", userController.getUsers);

module.exports = router;
