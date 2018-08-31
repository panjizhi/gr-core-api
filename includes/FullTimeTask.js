let _exitRequest = 0;

module.exports = {
    Start: (busyInterval, freeInterval, iterate) =>
    {
        Once();

        function Once()
        {
            iterate((status) =>
            {
                let inv = status ? busyInterval : freeInterval;
                Wait();

                function Wait()
                {
                    if (!inv)
                    {
                        return setImmediate(Once);
                    }

                    if (_exitRequest)
                    {
                        return process.exit();
                    }

                    --inv;
                    setTimeout(Wait, 1000);
                }
            });
        }
    },
    ReturnBusy: (cb) => cb(1),
    ReturnFree: (cb) => cb(0)
};

process.on('SIGINT', () =>
{
    _exitRequest = 1;
});
