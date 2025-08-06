const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const killPort = require('kill-port');
const path = require('path');
const itemsRouter = require('./routes/items');
const statsRouter = require('./routes/stats');
const ethereumRouter = require('./routes/ethereum');
const errorHandlerAlternative = require('./middleware/alternativeErrorHandler');
const { initRuntimeConfig } = require('./config/runtimeConfig');
require('dotenv').config();

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3001;

// Middleware
// app.use(cors({ origin: `http://localhost:${PORT}` }));
app.use(cors({ origin: `*` }));
app.use(express.json());
app.use(morgan('dev'));
app.use(express.json()); // added this for axios

// Routes
app.use('/api/items', itemsRouter);
app.use('/api/stats', statsRouter);

/**
 * @route   GET /api/endpoint
 * @desc    Retrieves the contract balance
 * @author  Pavelescu Maria
 * @access  public/private/auth-required
 * 
 * @param   {Request}  req  - Express request object. Expects JSON body:
 *          {
 *            smartContractAddress: "0x20b88bd52f362e30a63FF6DFAD81b7b34DC069f0",
 *            fromAddress: "0x365f14a97a16b380dd64b677ea0a92bafa6f606e"
 *          }
 * @param   {Response} res  - Express response object
 * @returns {JSON} Response JSON object:
 *          {
 *            success: true,
 *            message: "Transaction was successful",
 *            txHash: "<transaction hash>"
 *          }
 * 
 * @throws  {400} Bad Request - on invalid input
 * @throws  {500} Internal Server Error - on contract call failure
 * 
 * @example
 * // Request body:
 * {
 *   "smartContractAddress": "0x20b88bd52f362e30a63FF6DFAD81b7b34DC069f0",
 *   "fromAddress": "0x365f14a97a16b380dd64b677ea0a92bafa6f606e"
 * }
 * 
 * // Successful response:
 * {
 *   "success": true,
 *   "message": "Transaction was successful",
 *   "txHash": "0xabc123..."
 * }
 */

app.use('/api/ethereum/total-supply', ethereumRouter);

app.use(errorHandlerAlternative.errorHandlerAlternative());
// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static('client/build'));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
    });
}

const startServer = async (port) => {
    await initRuntimeConfig();
    const server = app.listen(port, () => {
        console.log(`Backend running on http://localhost:${port}`);
    });

    const shutdownHandler = (signal) => {
        console.log(`\nCaught ${signal}. Shutting down gracefully...`);
        server.close(() => {
            console.log('Server closed. Port released.');
            process.exit(0);
        });

        setTimeout(() => {
            console.error('Force exiting after timeout');
            process.exit(1);
        }, 5000);
    };

    process.on('SIGINT', () => shutdownHandler('SIGINT'));
    process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
    process.on('uncaughtException', (err) => {
        console.error('Uncaught Exception:', err);
        shutdownHandler('uncaughtException');
    });
};

const safeStart = async (port) => {
    // Kill port BEFORE starting server
    try {
        await killPort(port, 'tcp'); // Refactored this because killPort was an async function and we never had the promise fulfilled
        console.log(`Port ${port} free. Starting fresh server...`);
        await startServer(port);
    } catch (err) {
        console.log(`Port ${port} use. restart server...`);
        await startServer(port + 1); // this calls the start recusively and will never start the server if previous case errors - changing it to call the startServer
    }
}

safeStart(PORT);