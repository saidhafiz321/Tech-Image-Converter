import React, { useState, useCallback } from 'react';
import { Trash2, Download, Settings, RotateCw, Menu, X } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { PDFDocument } from 'pdf-lib';
import { Canvg } from 'canvg';

const ImageConverter = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [convertedFiles, setConvertedFiles] = useState([]);
  const [outputFormat, setOutputFormat] = useState('PNG');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [quality, setQuality] = useState(90);
  const [resize, setResize] = useState({ width: '', height: '' });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(prevFiles => [...prevFiles, ...files]);
  };

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    const files = Array.from(event.dataTransfer.files);
    setSelectedFiles(prevFiles => [...prevFiles, ...files]);
  }, []);

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const removeFile = (index) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const convertImages = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select files first.');
      return;
    }

    const converted = await Promise.all(selectedFiles.map(async (file) => {
      const img = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (resize.width && resize.height) {
        canvas.width = parseInt(resize.width);
        canvas.height = parseInt(resize.height);
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      let dataUrl;
      if (outputFormat === 'PDF') {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([canvas.width, canvas.height]);
        const imgData = canvas.toDataURL('image/png').split(',')[1];
        const image = await pdfDoc.embedPng(imgData);
        page.drawImage(image, { x: 0, y: 0, width: canvas.width, height: canvas.height });
        const pdfBytes = await pdfDoc.save();
        dataUrl = URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }));
      } else if (outputFormat === 'SVG') {
        const svgString = canvas.toDataURL('image/svg+xml');
        dataUrl = svgString;
      } else {
        dataUrl = canvas.toDataURL(`image/${outputFormat.toLowerCase()}`, quality / 100);
      }

      return {
        name: `${file.name.split('.')[0]}.${outputFormat.toLowerCase()}`,
        dataUrl
      };
    }));

    setConvertedFiles(converted);
  };

  const downloadFile = (file) => {
    const link = document.createElement('a');
    link.href = file.dataUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllAsZip = async () => {
    if (convertedFiles.length === 0) {
      alert('No files available for download.');
      return;
    }

    const zip = new JSZip();
    convertedFiles.forEach(file => {
      const base64Data = file.dataUrl.split(',')[1];
      zip.file(file.name, base64Data, { base64: true });
    });

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'converted_images.zip');
  };

  const removeConvertedFile = (index) => {
    setConvertedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleMenuClick = (format) => {
    setOutputFormat(format);
    setIsMenuOpen(false); // Menutup menu setelah memilih format
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-between">
      {/* Main Content */}
      <div>
        {/* Header Section */}
        <header className="bg-gray-800 p-4 flex justify-between items-center relative">
          <div className="text-xl font-bold">Tech Converter</div>
          <div className="lg:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          <nav className={`lg:flex lg:items-center lg:space-x-4 ${isMenuOpen ? 'block' : 'hidden'} lg:block lg:relative lg:top-0 lg:left-0 lg:w-auto absolute top-full left-0 right-0 bg-gray-800`}>
            <button 
              className="block lg:inline-block text-white hover:text-yellow-400 mt-2 lg:mt-0 px-4 py-2" 
              onClick={() => handleMenuClick('PNG')}
            >
              Convert to PNG
            </button>
            <button 
              className="block lg:inline-block text-white hover:text-yellow-400 mt-2 lg:mt-0 px-4 py-2" 
              onClick={() => handleMenuClick('JPEG')}
            >
              Convert to JPEG
            </button>
            <button 
              className="block lg:inline-block text-white hover:text-yellow-400 mt-2 lg:mt-0 px-4 py-2" 
              onClick={() => handleMenuClick('WEBP')}
            >
              Convert to WEBP
            </button>
            <button 
              className="block lg:inline-block text-white hover:text-yellow-400 mt-2 lg:mt-0 px-4 py-2" 
              onClick={() => handleMenuClick('PDF')}
            >
              Convert to PDF
            </button>
            <button 
              className="block lg:inline-block text-white hover:text-yellow-400 mt-2 lg:mt-0 px-4 py-2" 
              onClick={() => handleMenuClick('SVG')}
            >
              Convert to SVG
            </button>
          </nav>
        </header>

        <div className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto mt-10 p-6 bg-gray-800 rounded-lg shadow-xl font-overpass">
          <div className="text-center mb-6">
            <h2 className="text-2xl lg:text-3xl mb-2">Upload Files</h2>
            <div
              className="border-2 border-dashed border-gray-500 rounded-lg p-12 text-center cursor-pointer bg-gray-700 flex items-center justify-center"
              style={{ height: '150px' }} // Adjust the height here
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById('fileInput').click()}
            >
              <p className="text-gray-400">Drag & Drop files here or click to select files</p>
              <input
                id="fileInput"
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
              />
            </div>

            {selectedFiles.length > 0 && (
              <div className="flex flex-col mt-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex justify-between items-center bg-gray-600 p-2 rounded-lg mb-2">
                    <span className="truncate">{file.name}</span>
                    <button onClick={() => removeFile(index)} className="text-red-500 ml-2">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-xl lg:text-2xl mb-2">Output Format</h2>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              className="w-full p-2 border rounded-lg bg-gray-700 text-white border-gray-600"
            >
              <option value="PNG">PNG</option>
              <option value="JPEG">JPEG</option>
              <option value="WEBP">WEBP</option>
              <option value="PDF">PDF</option>
              <option value="SVG">SVG</option>
            </select>
          </div>

          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-yellow-400"
            >
              <Settings size={20} className="mr-2" />
              {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
            </button>
            <button
              onClick={convertImages}
              className="px-4 py-2 bg-yellow-400 text-black rounded-lg flex items-center"
            >
              <RotateCw size={20} className="mr-2" />
              Convert
            </button>
          </div>

          {showAdvanced && (
            <div className="mb-6 p-4 bg-gray-700 rounded-lg">
              <h3 className="text-lg lg:text-xl font-semibold mb-2 text-yellow-400">Advanced Settings</h3>
              <div className="mb-4">
                <label className="block mb-1 text-white">Quality (JPEG/WEBP)</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="w-full"
                />
                <span className="text-white">{quality}%</span>
              </div>
              <div>
                <label className="block mb-1 text-white">Resize</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Width"
                    value={resize.width}
                    onChange={(e) => setResize({...resize, width: e.target.value})}
                    className="w-1/2 p-2 border rounded bg-gray-800 text-white border-gray-600"
                  />
                  <input
                    type="number"
                    placeholder="Height"
                    value={resize.height}
                    onChange={(e) => setResize({...resize, height: e.target.value})}
                    className="w-1/2 p-2 border rounded bg-gray-800 text-white border-gray-600"
                  />
                </div>
              </div>
            </div>
          )}

          {convertedFiles.length > 0 && (
            <div>
              <h2 className="text-xl lg:text-2xl mb-4">Converted Files:</h2>
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={downloadAllAsZip}
                  className="px-4 py-2 bg-yellow-400 text-black rounded-lg"
                >
                  Download All as ZIP
                </button>
              </div>
              <ul>
                {convertedFiles.map((file, index) => (
                  <li key={index} className="flex justify-between items-center bg-gray-600 p-2 rounded-lg mb-2">
                    <span className="truncate">{file.name}</span>
                    <div className="flex items-center">
                      <button onClick={() => downloadFile(file)} className="text-yellow-400 ml-2">
                        <Download size={20} />
                      </button>
                      <button onClick={() => removeConvertedFile(index)} className="text-red-500 ml-2">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-center mt-10">
            <h2 className="text-lg lg:text-xl mb-2 font-bold text-yellow-400">Get it on Mobile</h2>
            <p className="text-sm text-gray-400 mb-4">Convert images directly on your mobile device using our <a href="#" className="text-yellow-400">Android Image Converter</a></p>
            <div className="flex justify-center gap-4">
              <a href="#">
                <img src="https://jdih.bp2mi.go.id/images/icons/playstore2.png" alt="Get it on Google Play" style={{ height: '80px', width: 'auto' }} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="bg-gray-800 text-gray-400 text-center p-4 mt-auto">
        <div className="mb-2">
          <a href="https://wa.me/081360917101" className="hover:text-yellow-400">Privacy Policy</a> | 
          <a href="https://wa.me/081360917101" className="hover:text-yellow-400"> Terms of Service</a> | 
          <a href="https://wa.me/081360917101" className="hover:text-yellow-400"> Contact Us</a>
        </div>
        <div>&copy; 2024 Tech Converter. All rights reserved.</div>
      </footer>
    </div>
  );
};

export default ImageConverter;
