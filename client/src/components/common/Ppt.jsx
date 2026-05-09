import { useState, useEffect } from 'react';
import { socket } from '../../services/socket';
import './Ppt.css';
import { Document, Page, pdfjs } from 'react-pdf';
import workerSrc from "pdfjs-dist/build/pdf.worker?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

function Ppt({ roomId, presenter, myId }) {
  const [file, setfile] = useState(null);
  const [page, setpage] = useState(1);
  const [numpages, setnumpages] = useState(null);

  const isPresenter = presenter === myId;

  console.log(roomId, presenter, myId);

  useEffect(() => {
    socket.on('ppt-update', ({ file }) => {
      setfile(file);
    })

    socket.on('slide-change', ({ page }) => {
      setpage(page);
    })

    return () => {
      socket.off('ppt-update');
      socket.off('slide-change');
    }
  }, []);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      socket.emit('ppt-upload', { roomId, file: reader.result });
    }
    reader.readAsDataURL(file);

  };

  const nextSlide = () => {
    if (page < numpages) {
      const newpage = page + 1;
      setpage(newpage);
      socket.emit("slide-change", {
        roomId,
        page: newpage
      });
    }
  }

  const prevSlide = () => {
    if (page > 1) {
      const newpage = page - 1;
      setpage(newpage);
      socket.emit("slide-change", {
        roomId,
        page: newpage
      });
    }
  }




  return (


    <div className="ppt-container">

      {/* Upload */}
      {isPresenter && (
        <div className="ppt-upload">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleUpload}
          />
        </div>
      )}
      

      {/* Viewer */}
      <div className="ppt-viewer">

        {file ? (
          <div className="ppt-scroll-box">
            <Document
              file={file}
              onLoadSuccess={({ numPages }) => setnumpages(numPages)}
            >
              <Page pageNumber={page} />
            </Document>
          </div>
        ) : (
          <p>No PPT uploaded</p>
        )}

      </div>

      {/* Controls */}
      {file && isPresenter && (
        <div className="ppt-controls">

          <button onClick={prevSlide}>Prev</button>

          <span>{page} / {numpages}</span>

          <button onClick={nextSlide}>Next</button>

        </div>
      )}

    </div>


//     <div className="ppt-container">

//       {isPresenter && (<div className="ppt-upload"><input type="file" accept='application/pdf' onChange={handleUpload} /> </div>)}

       
//       <div className="ppt-viewer">
//       {file ? (<div className="ppt-scroll-box"><Document file={file} onLoadSuccess={({ numpage }) => setnumpages(numpage)} >
//         <Page pageNumber={page} />
//       </Document> </div>) : (
//         <p>No PPT uploaded</p>
//       )}
//     </div>

//    {file && isPresenter && (
//     <div className="ppt-controls">

//       <button onClick={prevSlide}>Prev</button>

//       <span>{page} / {numpages}</span>

//       <button onClick={nextSlide}>Next</button>

//     </div>
//   )}

// </div>
  

)}
export default Ppt 