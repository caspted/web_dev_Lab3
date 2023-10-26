import { IncomingMessage, ServerResponse } from "http";
import fs from "node:fs/promises";
import pool from "./database";
import crypto from "node:crypto";

export async function handleVetClinic(response: ServerResponse) {
  const content = await fs.readFile("vet-clinic.html", "utf-8");
  response
    .writeHead(200, { "Content-Type": "text/html" })
    .end(content.toString());
}

export async function handleNewPatient(
  request: IncomingMessage,
  response: ServerResponse
) {
  let data = "";

  request.on("data", (chunk) => {
    data += chunk;
  });

  request.on("end", async () => {
    const formData = new URLSearchParams(data);

    const patientName = formData.get("patient_name");
    const species = formData.get("species");
    const age = formData.get("age");
    const sickness = formData.get("sickness");
    const uniqueToken = crypto.randomBytes(32).toString("base64url");

    const client = await pool.connect();
    try {
      const insertQuery =
        "INSERT INTO patients (patient_name, species, age, sickness, token) VALUES ($1, $2, $3, $4, $5)";
      const insertValues = [patientName, species, age, sickness, uniqueToken];
      await client.query(insertQuery, insertValues);

      response.writeHead(302, {
        Location: `/patient-details?token=${uniqueToken}`,
      });
      response.end();
    } catch (error) {
      console.error("Database error:", error);
      response.writeHead(500, { "Content-Type": "text/plain" });
      response.end("Internal Server Error");
    } finally {
      client.release();
    }
  });
}

export async function handlePatientDetails(
  response: ServerResponse,
  url: string
) {
  const patientToken = new URL(url, "http://localhost").searchParams.get(
    "token"
  );
  if (!patientToken) {
    response.writeHead(400, { "Content-Type": "text/plain" });
    response.end("Invalid request, Token not found.");
    return;
  }

  const patientDetails = await fetchPatientDetailsFromDatabase(patientToken);

  if (patientDetails) {
    const content = `
        <html>
        <head>
            <title>Patient Details</title>
            <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f5f5f5;
                margin: 0;
                padding: 0;
            }
            h1 {
                background-color: #0077b6;
                color: white;
                padding: 20px;
                text-align: center;
            }
            .patient-details {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: white;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
                border-radius: 5px;
            }
            .patient-details p {
                font-size: 16px;
                margin: 10px 0;
            }
            form {
                text-align: center;
            }
            form input[type="submit"] {
                background-color: #0077b6;
                color: white;
                border: none;
                padding: 10px 20px;
                cursor: pointer;
                font-size: 16px;
            }
            form input[type="submit"]:hover {
                background-color: #005b8f;
            }
        </style>
        </head>
        <body>
            <h1>Patient Details</h1>
            <p>Name: ${patientDetails.patient_name}</p>
            <p>Species: ${patientDetails.species}</p>
            <p>Age: ${patientDetails.age}</p>
            <p>Sickness: ${patientDetails.sickness}</p>
            <form action="/new-details" method="patch">
              <input type="hidden" name="token" value="${patientDetails.token}">
              <input type="submit" value="Update">
            </form>
        </body>
        </html>
      `;
    response.writeHead(200, { "Content-Type": "text/html" });
    response.end(content);
  } else {
    response.writeHead(404, { "Content-Type": "text/plain" });
    response.end("Patient not found.");
  }
}

export async function handleNewDetails(response: ServerResponse, url: string) {
  const patientToken = new URL(url, "http://localhost").searchParams.get(
    "token"
  );
  if (!patientToken) {
    response.writeHead(400, { "Content-Type": "text/plain" });
    response.end("Invalid request, Token not found.");
    return;
  }

  const content = await fs.readFile("update-patient.html", "utf-8");
  const contentWithToken = content.replace("<%= token %>", patientToken);

  response.writeHead(200, { "Content-Type": "text/html" });
  response.end(contentWithToken);
}

export async function handleUpdatePatient(
  request: IncomingMessage,
  response: ServerResponse
) {
  let data = "";
  request.on("data", (chunk) => {
    data += chunk;
  });
  request.on("end", async () => {
    const updatedPatient = new URLSearchParams(data);
    const methodOverride = updatedPatient.get("_method");

    if (methodOverride === "PATCH") {
      const patientToken = updatedPatient.get("token");
      const updatedName = updatedPatient.get("patient_name");
      const updatedSpecies = updatedPatient.get("species");
      const updatedAge = updatedPatient.get("age");
      const updatedSickness = updatedPatient.get("sickness");

      const client = await pool.connect();
      try {
        const updateQuery =
          "UPDATE patients SET patient_name = $1, species = $2, age = $3, sickness = $4 WHERE token = $5";
        const updateValues = [
          updatedName,
          updatedSpecies,
          updatedAge,
          updatedSickness,
          patientToken,
        ];
        await client.query(updateQuery, updateValues);

        response.writeHead(302, {
          Location: `/patient-details?token=${patientToken}`,
        });
        response.end();
      } catch (error) {
        console.error("Database error:", error);
        response.writeHead(500, { "Content-Type": "text/plain" });
        response.end("Internal Server Error");
      } finally {
        client.release();
      }
    } else {
      response.writeHead(400, { "Content-Type": "text/plain" });
      response.end("Invalid request method.");
    }
  });
}

async function fetchPatientDetailsFromDatabase(patientToken: string) {
  const client = await pool.connect();
  try {
    const query = "SELECT * FROM patients WHERE token = $1";
    const result = await client.query(query, [patientToken]);
    return result.rows[0];
  } catch (error) {
    console.error("There is an error in the database:", error);
  } finally {
    client.release();
  }
}
