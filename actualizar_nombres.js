
const admin = require("firebase-admin");
const fs = require("fs");
const serviceAccount = require("./serviceAccountKey.json"); // ⚠️ Asegurate de tener este archivo

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Lista de usuarios y nombres
const usuarios = [
  { id: "gabrielazurita", nombre: "Gabriela Zurita" },
  { id: "manuelmoyano", nombre: "Manuel  Moyano" },
  { id: "alejandrogomez", nombre: "Alejandro Gomez" },
  { id: "sergiorodrigodiaz", nombre: "Sergio Rodrigo Diaz" },
  { id: "facundozaracho", nombre: "Facundo Zaracho" },
  { id: "alanabella", nombre: "Alan Abella" },
  { id: "juanrico", nombre: "Juan Rico" },
  { id: "maximilianorodriguez", nombre: "Maximiliano Rodriguez" },
  { id: "franciscopicone", nombre: "Francisco Picone" },
  { id: "nairabruzzoni", nombre: "Naira Bruzzoni" },
  { id: "barbarabresan", nombre: "Barbara Bresan" },
  { id: "cristianugarte", nombre: "Cristian Ugarte" },
  { id: "juanpablorodas", nombre: "Juan Pablo Rodas" },
  { id: "dannygomez", nombre: "Danny Gomez" },
  { id: "jeremiastardivo", nombre: "Jeremias Tardivo" },
  { id: "agustinmasanti", nombre: "Agustin Masanti" },
  { id: "gonzaloacevedo", nombre: "Gonzalo Acevedo" },
  { id: "juancastro", nombre: "Juan Castro" },
  { id: "benjamindegiorgi", nombre: "Benjamin De Giorgi" },
  { id: "ignaciotulian", nombre: "Ignacio Tulian" },
  { id: "agustingiuliani", nombre: "Agustin Giuliani" },
  { id: "juancruzavila", nombre: "Juan Cruz Avila" },
  { id: "miltoncanal", nombre: "Milton Canal" },
  { id: "ignaciocasas", nombre: "Ignacio Casas" },
  { id: "ericandrada", nombre: "Eric Andrada" },
  { id: "paolacasalino", nombre: "Paola Casalino" },
  { id: "nataliasalas", nombre: "Natalia Salas" },
  { id: "francojosegiglio", nombre: "Franco Jose Giglio" },
  { id: "brendafernandez", nombre: "Brenda Fernandez" },
  { id: "alexisvarela", nombre: "Alexis Varela" },
  { id: "gonzaloandines", nombre: "Gonzalo Andines" },
  { id: "gastonhruby", nombre: "Gaston Hruby" },
  { id: "martinmelendez", nombre: "Martin Melendez" },
  { id: "rodrigorosello", nombre: "Rodrigo Rosello" },
  { id: "karenarteaga", nombre: "Karen Arteaga" },
  { id: "carolmanzoli", nombre: "Carol Manzoli" },
  { id: "agustínramallo", nombre: "Agustín Ramallo" },
  { id: "valentinaluna", nombre: "Valentina Luna" },
  { id: "karinabarzola", nombre: "Karina Barzola" },
  { id: "alejandroorellano", nombre: "Alejandro Orellano" },
  { id: "elizabethorellano", nombre: "Elizabeth Orellano" },
  { id: "deborasilva", nombre: "Debora Silva" },
  { id: "ignaciococca", nombre: "Ignacio Cocca" },
  { id: "lucianalepore", nombre: "Luciana Lepore" },
  { id: "benjamintaddeocordoba", nombre: "Benjamin Taddeo Cordoba" },
  { id: "marcosgulli", nombre: "Marcos Gulli" },
];

(async () => {
  for (const user of usuarios) {
    try {
      const ref = db.collection("usuarios").doc(user.id);
      await ref.update({ nombre: user.nombre });
      console.log(`✅ Nombre actualizado para ${user.id}`);
    } catch (err) {
      console.error(`❌ Error al actualizar ${user.id}:`, err.message);
    }
  }
})();
