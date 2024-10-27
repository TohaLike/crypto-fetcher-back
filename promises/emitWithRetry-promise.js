
const RETRY_INTERVAL = 5000;
const MAX_RETRIES = 3;

export const emitWithRetry = async (socket, roomId, event, data, retries = MAX_RETRIES) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const sendEvent = () => {
      attempts++;
      socket.to(roomId).emit(event, data?.message, (ack) => {
        if (ack) {
          console.log(`Acknowledgment received for event: ${event}`);
          resolve();
        } else if (attempts < retries) {
          console.log(retries)
          console.log(`No acknowledgment received for event: ${event}, retrying... (${attempts})`);
          setTimeout(sendEvent, RETRY_INTERVAL);
        } else {
          console.log(`Failed to deliver event: ${event} after ${retries} attempts`);
          reject(new Error(`Failed to deliver event: ${event} after ${retries} attempts`));
        }
      })
    }
    sendEvent();
  })
}