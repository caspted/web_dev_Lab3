import http from 'http'
import handleRequest from './form';

const server = http.createServer(handleRequest);

server.listen(3000, () => {
  console.log('Server starts at http://localhost:3000')
})