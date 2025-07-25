const archiver = require('archiver');

// @desc    Download component code as a ZIP file
// @route   POST /api/projects/download
// @access  Private
exports.downloadComponent = async (req, res) => {
    const { jsx, css, projectName } = req.body; // Receive code and name from frontend

    if (!jsx && !css) {
        return res.status(400).json({ message: 'No code provided for download.' });
    }

    const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
    });

    res.attachment(`${projectName.replace(/[^a-zA-Z0-9]/g, '_') || 'component'}.zip`); // Set filename for download

    archive.on('error', function(err) {
        res.status(500).send({ error: err.message });
    });

    archive.pipe(res);

    if (jsx) {
        archive.append(jsx, { name: 'Component.jsx' });
    }
    if (css) {
        archive.append(css, { name: 'Component.css' });
    }

    archive.finalize();
};