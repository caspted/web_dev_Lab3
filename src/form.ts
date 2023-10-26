import { IncomingMessage, ServerResponse } from "http";
import { handleVetClinic, handleNewPatient, handlePatientDetails, handleNewDetails, handleUpdatePatient } from './handlers';

export default async function handleRequest(request: IncomingMessage, response: ServerResponse) {
  const url = request.url;
  const method = request.method;

  console.log("Debugging -- url is", url, "while method is", method);

  if (url === '/vet-clinic' && method === 'GET') {
    handleVetClinic(response);
  } else if (url?.startsWith('/patient') && method === 'POST') {
    handleNewPatient(request, response);
  } else if (url?.startsWith('/patient-details') && method === 'GET') {
    handlePatientDetails(response, url);
  } else if (url?.startsWith('/new-details') && method === 'GET') {
    handleNewDetails(response, url);
  } else if (url?.startsWith('/update-patient') && method === 'POST') {
    handleUpdatePatient(request, response);
  } else {
    response.writeHead(200).end('Have this echo server as your safe space');
  }
}