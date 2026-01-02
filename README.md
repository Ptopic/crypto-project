# crypto-project

## Getting Started

### Prerequisites

- Node.js
- npm
- Docker
- Access credentials for the RPC server

### Installation

1. Clone the repository
   ```sh
   git clone .
    ```
2. Position to the project folder
    ```sh
    cd crypto-project
    ```
3. Create a `.env` file from the `.env.example` file
    ```sh
    cp .env.example .env
    ```
4. Fill in the environment variables with your own values.
5. Install the dependencies
    ```sh
    npm install
    ```
6. Start Redis via Docker
    ```sh
    docker run -p 6379:6379 -it redis/redis-stack-server:latest
    ```
7. Start the development server
    ```sh
    npm run dev
    ```
8. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.