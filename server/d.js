const mongoose = require('mongoose');
const Student = require('./models/student'); // adjust path if needed

const students = [
  {
    name: "Arun Yerram",
    email: "arunyerram12022005@gmail.com",
    phone: "9123456789",
    codeforcesHandle: "Arunyerram_12"
  },
  {
    name: "Petr Mitrichev",
    email: "petr.mitrichev@example.com",
    phone: "9112345678",
    codeforcesHandle: "Petr"
  },
  {
    name: "Gennady Korotkevich",
    email: "gennady.korotkevich@example.com",
    phone: "9001234567",
    codeforcesHandle: "tourist"
  },
  {
    name: "Um_nik",
    email: "umnik@example.com",
    phone: "9123451234",
    codeforcesHandle: "Um_nik"
  },
  {
    name: "Radewoosh",
    email: "radewoosh@example.com",
    phone: "9111122233",
    codeforcesHandle: "Radewoosh"
  }
];

mongoose.connect('mongodb+srv://ARUN:1234@cluster0.mmyigrp.mongodb.net/studentmanagerDB?retryWrites=true&w=majority&appName=Cluster0').then(async () => {
  await Student.insertMany(students);
  console.log('Trusted data inserted!');
  mongoose.disconnect();
});
