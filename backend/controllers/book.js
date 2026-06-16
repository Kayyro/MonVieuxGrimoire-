const Book = require("../models/Book");
const fs = require("fs");
const path = require("path");

// Création d'un livre
exports.createBook = async (req, res, next) => {
  try {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;
    const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`,
    });
    await book.save();
    res.status(201).json({ message: "Livre enregistré !" });
  } catch (error) {
    res.status(400).json({ message: error.message || "Erreur lors de la création du livre" });
  }
};

// Récupération d'un livre
exports.getOneBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });
    if (!book) return res.status(404).json({ message: "Livre introuvable" });
    res.status(200).json(book);
  } catch (error) {
    res.status(404).json({ message: error.message || "Livre introuvable" });
  }
};

// Récupération de tous les livres
exports.getAllBooks = async (req, res, next) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (error) {
    res.status(400).json({ message: error.message || "Erreur lors de la récupération des livres" });
  }
};

// Modification d'un livre
exports.updateBook = async (req, res, next) => {
  try {
    const bookObject = req.file
      ? {
          ...JSON.parse(req.body.book),
          imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`,
        }
      : { ...req.body };

    delete bookObject._userId;

    const book = await Book.findOne({ _id: req.params.id });
    if (!book) return res.status(404).json({ message: "Livre introuvable" });
    if (book.userId != req.auth.userId) {
      return res.status(401).json({ message: "Non autorisé" });
    }

    await Book.updateOne(
      { _id: req.params.id },
      { ...bookObject, _id: req.params.id },
      { runValidators: true }
    );
    res.status(200).json({ message: "Livre modifié !" });
  } catch (error) {
    res.status(400).json({ message: error.message || "Erreur lors de la modification du livre" });
  }
};

// Suppression d'un livre
exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });
    if (!book) return res.status(404).json({ message: "Livre introuvable" });
    if (book.userId != req.auth.userId) {
      return res.status(401).json({ message: "Non autorisé" });
    }
    const filename = book.imageUrl.split("/images/")[1];
    fs.unlink(path.join("images", filename), async () => {
      await Book.deleteOne({ _id: req.params.id });
    });
    res.status(200).json({ message: "Livre supprimé !" });
  } catch (error) {
    res.status(400).json({ message: error.message || "Erreur lors de la suppression du livre" });
  }
};

// Notation d'un livre
exports.rateBook = async (req, res, next) => {
  try {
    const grade = req.body.rating;

    if (grade < 0 || grade > 5) {
      return res.status(400).json({ message: "La note doit être entre 0 et 5" });
    }

    const book = await Book.findOne({ _id: req.params.id });
    if (!book) return res.status(404).json({ message: "Livre introuvable" });

    const userIdArray = book.ratings.map((rating) => rating.userId);
    if (userIdArray.includes(req.auth.userId)) {
      return res.status(403).json({ message: "Vous avez déjà noté ce livre" });
    }

    const newRatings = [...book.ratings, { userId: req.auth.userId, grade }];
    const averageGrade = newRatings.reduce((acc, r) => acc + r.grade, 0) / newRatings.length;
    const roundedAverage = Math.round(averageGrade * 10) / 10;

    await Book.updateOne(
      { _id: req.params.id },
      { ratings: newRatings, averageRating: roundedAverage, _id: req.params.id }
    );

    const updatedBook = await Book.findOne({ _id: req.params.id });
    return res.status(200).json(updatedBook);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Erreur lors de la notation du livre" });
  }
};

// Top 3 des livres les mieux notés
exports.getBestRating = async (req, res, next) => {
  try {
    const books = await Book.find().sort({ averageRating: -1 }).limit(3);
    res.status(200).json(books);
  } catch (error) {
    res.status(400).json({ message: error.message || "Erreur lors de la récupération du top 3" });
  }
};