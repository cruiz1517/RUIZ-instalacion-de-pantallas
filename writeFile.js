// Importar el módulo fs
const fs = require('fs');

// Texto que queremos escribir en el archivo
const texto = 'Este es el texto que queremos escribir en el archivo.';

// Ruta del archivo donde queremos escribir
const rutaArchivo = 'miArchivo.txt';

// Escribir el texto en el archivo
fs.writeFile(rutaArchivo, texto, (err) => {
    if (err) {
        return console.error('Error escribiendo en el archivo:', err);
    }
    console.log('Texto escrito exitosamente en el archivo:', rutaArchivo);
});
