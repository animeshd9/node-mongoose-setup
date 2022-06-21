const { Controller } = require( '../../system/controllers/Controller' );
const { MediaService } = require( './../services/MediaService' );
const { Media } = require( './../models/Media' );
const autoBind = require( 'auto-bind' );
const multer = require( 'multer' );
const sharp = require( 'sharp' );
const fs = require( 'fs' );
const utils = require( '../../system/helpers/Utility' ),
    config = require( '../../config/config' ).getConfig(),
    mediaService = new MediaService(
        new Media().getInstance()
    );

class MediaController extends Controller {

    // file upload using multer
    storage = multer.diskStorage( {
        'destination': function( req, file, cb ) {
            const dir = config.UPLOAD_PATH;

            fs.exists( dir, ( exist ) => {
                if ( !exist ) {
                    return fs.mkdir( dir, ( error ) => cb( error, dir ) );
                }
                return cb( null, dir );
            } );
        },
        'filename': function( req, file, cb ) {
            const fileOriginalName = utils.slugify( file.originalname );

            cb( null, `${( new Date() ).getTime() }-${ fileOriginalName}` );
        }
    } );
    upload = multer( {
        'storage': this.storage,
        'limits': {
            'fileSize': 1024 * 1024 * 5
        },
        'fileFilter': function( req, file, cb ) {
            // reject a file
            console.log( req.file );
            // const stats = fs.statSync( file.originalname );
            
            // console.log( stats.size );
            if ( file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif' ) {
                cb( null, true );
            } else {
                cb( null, false );
            }
        }
    } );

    constructor( service ) {
        super( service );
        autoBind( this );
    }

    async insert( req, res, next ) {
        try {
            const uploadPath = config.UPLOAD_PATH;

            req.file.path = req.file.path.split( `${uploadPath }/` )[ 1 ];
            console.log( req.file.destination );
            console.log( req.file.path );
            console.log( req.file );
            if ( req.file.size > 1024 * 50 ) {
                console.log( req.file.size );
                console.log( 'resize' );

                await sharp( req.file.path ).resize( 500, 500 ).toFile( `/home/animesh/Work/test/node-mongoose-setup/uploads/${req.file.path}` );

            
                console.log( 'sharp' );
                // console.log( req.file );
                // const response = await this.service.insert( req.file );

                // return res.status( response.statusCode ).json( response );
            }
            const response = await this.service.insert( req.file );
            
            console.log( req.file.size );

            return res.status( response.statusCode ).json( response );
            
        } catch ( e ) {
            next( e );
        }
    }

    fileFilter = ( req, file, cb ) => {
        // reject a file
        if ( file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif' ) {
            cb( null, true );
        } else {
            cb( null, false );
        }
    };

    async delete( req, res, next ) {
        const { id } = req.params;

        try {
            const response = await this.service.delete( id );
            // File Unlinking..

            if ( response.data.path ) {
                console.log( 'unlink item', response.data.path );
                fs.unlink( response.data.path, ( err ) => {
                    if ( err ) {
                        console.log( 'error deleting file' );
                        throw err;
                    }
                    console.log( 'File deleted!' );
                } );
            }
            return res.status( response.statusCode ).json( response );
        } catch ( e ) {
            next( e );
        }
    }

}

module.exports = new MediaController( mediaService );
