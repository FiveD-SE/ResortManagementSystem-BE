/* eslint-disable @typescript-eslint/no-require-imports */
const dotenv = require('dotenv');
dotenv.config();

const PayOS = require('@payos/node');

const payOS = new PayOS(
	process.env.PAYOS_CLIENT_ID as string,
	process.env.PAYOS_API_KEY as string,
	process.env.PAYOS_CHECKSUM_KEY as string,
);

export { payOS };
