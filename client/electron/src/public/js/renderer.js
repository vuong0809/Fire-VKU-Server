
connectSerial.addEventListener('click', Serial);

async function Serial() {
    if (navigator.serial) {

        const log = document.getElementById('target');

        try {
            var count = 0;
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 9600 });


            const decoder = new TextDecoderStream();

            port.readable.pipeTo(decoder.writable);

            const inputStream = decoder.readable;
            const reader = inputStream.getReader();

            const write = document.getElementById('writeSerial');
            write.addEventListener('click', sendSerial);
            // setInterval(() => {
            //     if (object != undefined) {
            //         sendSerial();
            //     }
            // }, 1000);


            async function sendSerial() {
                const encoder = new TextEncoder();
                const writer = port.writable.getWriter();
                await writer.write(encoder.encode(`${object}\n`));
                writer.releaseLock();
            }

            while (true) {
                const { value, done } = await reader.read();
                if (value) {
                    log.textContent += value + '\n';
                    console.log(value + '\n');
                }
                if (done) {
                    console.log('[readLoop] DONE', done);
                    reader.releaseLock();
                    break;
                }
            }
        }
        catch (error) {
            log.innerHTML = error;
            console.log(error);
        }
    } else {
        console.log('Web Serial API not supported.');
    }
}

