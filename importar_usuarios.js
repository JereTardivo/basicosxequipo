const admin = require("firebase-admin");
const usuarios = require("./usuarios/usuarios_firestore.json");
const serviceAccount = require("./credenciales.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function importarUsuarios() {
  for (const id in usuarios) {
    const user = usuarios[id];

    // Accedemos a los valores reales desde .fields
    const usuario = user?.fields?.usuario?.stringValue;
    const password = user?.fields?.password?.stringValue;
    const equipo = user?.fields?.equipo?.stringValue;

    if (!usuario || !password || !equipo) {
      console.warn(`⚠️ Usuario ${id} tiene campos faltantes. Omitido.`);
      continue;
    }

    try {
      await db.collection("usuarios").doc(id).set({
        usuario,
        password,
        equipo,
      });
      console.log(`✅ Usuario ${id} importado`);
    } catch (err) {
      console.error(`❌ Error al importar ${id}:`, err.message);
    }
  }
}

importarUsuarios();
