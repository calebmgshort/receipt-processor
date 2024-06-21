Steps to run the server:
1. git clone https://github.com/calebmgshort/receipt-processor.git
2. cd receipt-processor
3. docker build -t receipt-processor .
4. docker run -dp 3000:3000 receipt-processor
5. Submit requests to http://localhost:3000. You can change the port number in the docker run command if port 3000 is taken