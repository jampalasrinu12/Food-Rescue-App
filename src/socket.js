import { io } from "socket.io-client";
import { WEB_SOCKET_URL } from "./config";

const socket = io(WEB_SOCKET_URL);

export default socket;