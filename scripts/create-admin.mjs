import bcrypt from "bcrypt";
import mysql from "mysql2/promise";

const SALT_ROUNDS = 10;

async function createAdmin() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "flaps",
  });

  try {
    // Email e senha padrão para teste
    const email = "admin@flaps.com";
    const password = "admin123456";

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Inserir admin no banco
    await connection.execute(
      "INSERT INTO admins (email, passwordHash, name, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())",
      [email, passwordHash, "Admin Flaps", true]
    );

    console.log("✅ Admin criado com sucesso!");
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Senha: ${password}`);
    console.log("\n⚠️  IMPORTANTE: Mude a senha após o primeiro login!");
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      console.log("⚠️  Admin com este email já existe");
    } else {
      console.error("❌ Erro ao criar admin:", error);
    }
  } finally {
    await connection.end();
  }
}

createAdmin();
