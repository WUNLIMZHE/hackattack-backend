Running the backend server
-------------------------------------------------------
Clone this repo:
```
git clone https://github.com/WUNLIMZHE/hackattack-backend.git
cd hackattack-backend
```
**Running with Docker** <br/>
1. Make sure you have Docker Desktop installed.<br/>
Docker installation link: <br/>
```
https://www.docker.com/
```

2. Start Docker Desktop.<br/>

3. Build the project and run (first time only).<br/>
```
docker-compose up --build
```
This will build both the backend and ML services, then start them.

4. Start the Project (next time)<br/>
```
docker-compose up -d
```
This will start your containers in the background without rebuilding.
