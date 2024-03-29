async function retryCatch(callback, loginMode, retries) {
  try {
    return await callback(loginMode);
  } catch (error) {
    console.log("Retry Function: ", error)
    if (retries > 0) {
      console.log(`RETRYING: retries left - ${retries}`)
      return await retryCatch(callback, loginMode, retries - 1);
    } else {
      return error;
    }
  }
}

module.exports = retryCatch;
