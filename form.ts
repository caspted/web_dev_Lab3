import http, { IncomingMessage, ServerResponse } from "http";
import fs from 'node:fs/promises'
import pool from './database'

export default async function handleRequest(request: IncomingMessage, response: ServerResponse) {
  const url = request.url;
  const method = request.method

  console.log('Debugging -- url is', url, 'while method is', method);

  if (url === '/vet-clinic' && method === 'GET') {
    const content = await fs.readFile('vet-clinic.html', 'utf-8');
    response
    .writeHead(200, { 'Content-Type': 'text/html'})
    .end(content.toString())
  } else if (url === '/patient' && method === 'POST') {
    let data = '';

    request.on('data', (chunk) => {
      data += chunk;
    })

    request.on('end', async () => {
      const newPatient = JSON.parse(data)

      const client = await pool.connect()
      try {
        const insertQuery = 'INSERT INTO patients (patient_name, species, age, sickness, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)'
        const insertValues = [[newPatient.patient_name, newPatient.species, newPatient.age, newPatient.sickness, newPatient.created_at, newPatient.updated_at]];
        const result = await client.query(insertQuery, insertValues)

        const patientId = result.rows[0].id;
        response.writeHead(201, { 'Content-Type': 'text/plain'});
        response.end(`Patients created with ID: ${patientId}`)

      } finally {
        client.release
      }
    })

  } else if (url === '/patient' && (method === 'PUT' || method === 'PATCH')) {
    let data = '';

    request.on('data', (chunk) => {
      data += chunk
    })

    request.on('end', async () => {
      const updatedPatient = JSON.parse(data)

      const client = await pool.connect()
      try {
        const updateQuery = 'UPDATE patients SET patient_name = $1, species = $2, age = $3, sickness = $4, update_at = $5 WHERE patient_id = $6'
        const updateValues = [updatedPatient.patient_name, updatedPatient.species, updatedPatient.age, updatedPatient.sickness, updatedPatient.updated_at, updatedPatient.id]
        await client.query(updateQuery, updateValues)

        response
        .writeHead(200, { 'Content-Type': 'text/plain'})
        .end(`Patient updated successfully`)
      } finally {
        client.release()
      }
    })

  } else {
      response.writeHead(200).end('Have this echo server as your safe space');
  }
}

const server = http.createServer(handleRequest);

server.listen(3000, () => {
  console.log('Server starts at http://localhost:3000')
})