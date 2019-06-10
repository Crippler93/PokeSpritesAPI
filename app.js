const express = require('express');
const app = express();
const path = require('path');
const request = require('request');
const fs = require('fs');

const apiUrl = 'https://pokeapi.co/api/v2/';
const allowedTypesImg = ["back_default", "front_default", "front_shiny"];

app.get('/images/pokemon', (req, res, next) => {
    // Tomar los query params 'name' y 'imageType' con valor con defecto
    const {name, imageType = 'front_default'} = req.query;

    // Verificamos si imageType esta dentro de los tipos permitidos
    if (!allowedTypesImg.includes(imageType)) {
        res.status(400).send('Not allowed type of image')
        return;
    }

    // Si no existe el nombre del pokemon retornar 400 Bad request
    if (!name) { res.status(400).send('Not name provided'); return;}
    
    // Buscar todos los archivos guardados en el servidor
    const files = fs.readdirSync(path.join(__dirname, 'public') + '/images');

    // Retorna la imagen cacheada si existe dentro de los archivos
    if (files.includes(`${name}_${imageType}.png`)) {
        res.sendFile(path.join(__dirname, 'public') + `/images/${name}_${imageType}.png`);
        return;
    }

    //Si la imagen no existe hace un fetch en base al imageType y name
    request(`${apiUrl}pokemon/${name}`, { json: true }, (err, response, body) => {
        if (err) { res.status(500).send(err); return; }
        if (body == 'Not Found') { 
            res.status(404).send(`Pokemon ${name} not found`);
            return;
        }
        
        // Guardamos la url de la imagen
        let urlOfImage = body.sprites[imageType]

        // Guardamos el stream en un archivo
        const savedPath = `public/images/${name}_${imageType}.png`;
        request(urlOfImage).pipe(fs.createWriteStream(savedPath)).on('close', () => {
            res.sendFile(path.join(__dirname, 'public') + `/images/${name}_${imageType}.png`);
        });

    });

})


// Retorna el estado si existe alguna imagen con el nombre de ese pokemon en el servidor
app.get('/images/pokemon/:pokemon/status', (req, res, next) => {
    let cached = false;
    const {pokemon} = req.params
    const files =  fs.readdirSync(path.join(__dirname, 'public') + '/images');
    files.forEach((nameFile) => {
        const [filePokemon] = nameFile.split('_');
        if (filePokemon === pokemon) { cached = true }
    })
    res.send(cached ? 'cache' : 'unknown')
})

app.listen('8000', () => {
    console.log('🚀 Running on port 3000')
})