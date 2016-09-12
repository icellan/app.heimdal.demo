/**
 * Nestr encryption helpers
 *
 * NOTES:
 * Initialization vectors (iv) and salts (salt) are called such, and not keys, precisely because they need not be kept secret.
 * It is safe, and customary, to encode such data along with the encrypted/hashed element.
 * What an IV or salt needs is to be used only once with a given key or password.
 */
Heimdal.encryption = (function() {

	'use strict';
	return function encryption() {
		this.constructor = encryption;
		this.constructor.prototype = new Object();
		this.constructor.prototype.constructor.apply(this, arguments);

		/**
		 * xor 8 byte integers (256 bit)
		 *
		 * @param x hex string / BitArray
		 * @param y hex string / BitArray
		 * @returns hex string
		 */
		this.xor8 = function(x,y) {
			if (typeof x === 'string') {
				x = sjcl.codec.hex.toBits(x);
			}
			if (typeof y === 'string') {
				y = sjcl.codec.hex.toBits(y);
			}

			return sjcl.codec.hex.fromBits(_xor8(x,y));
		};

		/**
		 * initialize encryption class with a secret that is encrypted with the password
		 * This will fail with a short password
		 *
		 * @param password
		 */
		this.importSecretKey = function(password, encryptedKey) {
			if (!password || password.length < 16) {
				throw new Error('This function cannot be called with a short password. Minimum length is 16 characters');
			}
			var secretKey = this.decryptWithPassword(password, encryptedKey);
			this.generateKeysFromSecret(secretKey);
		};

		/**
		 * Generate encryption keys from password
		 */
		this.generateKeysFromSecret = function(secretKey) {
			if (typeof secretKey === 'string') {
				secretKey = sjcl.codec.hex.toBits(secretKey);
			}
			eccKeys = sjcl.ecc.elGamal.generateKeys(256, null, sjcl.bn.fromBits(secretKey));
			ecdsaKeys = sjcl.ecc.ecdsa.generateKeys(256, null, sjcl.bn.fromBits(secretKey));
		};

		/**
		 * get the public key associated with the given tokens
		 *
		 * @returns string
		 */
		this.getPublicKey = function() {
			checkKeys();
			var publicKey = eccKeys.pub.get();
			return sjcl.codec.hex.fromBits(publicKey.x) + sjcl.codec.hex.fromBits(publicKey.y);
		};

		/**
		 * Encrypt the given text(!) message using current keys
		 *
		 * @param message
		 * @returns {*}
		 */
		this.encrypt = function(message, publicKey) {
			if (typeof message === 'object') {
				message = JSON.stringify(message);
			}
			if (typeof publicKey === 'string') {
				var public_key_bits = sjcl.codec.hex.toBits(publicKey);
				publicKey = new sjcl.ecc.elGamal.publicKey(sjcl.ecc.curves.c256, public_key_bits);
			} else {
				checkKeys();
				publicKey = eccKeys.pub;
			}
			// generate random iv
			var iv   = Random.hexString(20); //sjcl.codec.base64.fromBits(sjcl.random.randomWords(4));
			// generate random salt
			var salt = Random.hexString(20); //sjcl.codec.base64.fromBits(sjcl.random.randomWords(4));
			var params = sjcl.json._add({
				iv: iv,
				salt: salt
			}, encryptionParams);
			var encrypted = JSON.parse(sjcl.encrypt(publicKey, message, params));
			var out = JSON.stringify({
				iv: encrypted.iv,
				salt: encrypted.salt,
				kemtag: encrypted.kemtag,
				ct: encrypted.ct
			});

			return out;
		};

		/**
		 * Decrypt the given message
		 *
		 * @param encryptedMessage (json string, json object, base64 string)
		 * @returns {*}
		 */
		this.decrypt = function(encryptedMessage, secretKey) {
			if (secretKey) {
				if (typeof secretKey === 'string') {
					secretKey = sjcl.codec.hex.toBits(secretKey);
				}
				var keys = sjcl.ecc.elGamal.generateKeys(256, null, sjcl.bn.fromBits(secretKey));
				var eccSecret = keys.sec;
			} else {
				checkKeys();
				var eccSecret = eccKeys.sec;
			}

			if (typeof encryptedMessage === "string") {
				encryptedMessage = JSON.parse(encryptedMessage);
			}

			var params = sjcl.json._add({
				iv: encryptedMessage.iv,
				salt: encryptedMessage.salt,
				kemtag: encryptedMessage.kemtag,
				ct: encryptedMessage.ct
			}, encryptionParams);
			return sjcl.decrypt(eccSecret, JSON.stringify(params));
		};

		/**
		 * Encrypt the given text(!) message using the given password key
		 * This function does not use the public/private key of the user, only the internal params
		 *
		 * @params password string
		 * @param message
		 * @returns {*}
		 */
		this.encryptWithPassword = function(password, message) {
			if (typeof message === 'object') {
				message = JSON.stringify(message);
			}
			// generate random iv
			var iv   = Random.hexString(20);
			// generate random salt
			var salt = Random.hexString(20);
			var params = sjcl.json._add({
				iv: iv,
				salt: salt
			}, encryptionParams);
			var encrypted = JSON.parse(sjcl.encrypt(password, message, params));
			return JSON.stringify({
				iv: encrypted.iv,
				salt: encrypted.salt,
				ct: encrypted.ct
			});
		};

		/**
		 * Decrypt the given message using the given password
		 * This function does not use the public/private key of the user, only the internal params
		 *
		 * @params password
		 * @param encryptedMessage (json string, json object, base64 string)
		 * @returns {*}
		 */
		this.decryptWithPassword = function(password, encryptedMessage) {
			if (typeof encryptedMessage === "string") {
				encryptedMessage = JSON.parse(encryptedMessage);
			}

			var params = sjcl.json._add({
				iv: encryptedMessage.iv,
				salt: encryptedMessage.salt,
				ct: encryptedMessage.ct
			}, encryptionParams);
			return sjcl.decrypt(password, JSON.stringify(params));
		};

		/**
		 * Create a signature of the message with the internal key
		 *
		 * @param message
		 */
		this.sign = function(message) {
			checkKeys();
			var hash = sjcl.hash.sha256.hash(message);
			return sjcl.codec.hex.fromBits(ecdsaKeys.sec.sign(hash));
		};

		/**
		 * Verify a signature with the given OR internal public key
		 *
		 * @param message
		 * @param signature
		 * @param publicKey
		 */
		this.verify = function(message, signature, publicKey) {
			if (publicKey === undefined) {
				checkKeys();
				publicKey = ecdsaKeys.pub;
			} else if (typeof(publicKey) === 'string') {
				// unserialize public key
				var public_key_bits = sjcl.codec.hex.toBits(publicKey);
				publicKey = new sjcl.ecc.ecdsa.publicKey(sjcl.ecc.curves.c256, public_key_bits);
			}
			if (!publicKey) {
				throw new Error('Cannot verify signature. No public key available.');
			}

			var hash = sjcl.hash.sha256.hash(message);
			var verify = false;
			try {
				verify = publicKey.verify(hash, sjcl.codec.hex.toBits(signature));
			} catch(e) {}
			return verify ? true : false;
		};

		/**
		 * sha256 helper function
		 *
		 * @params Utf8 string
		 */
		this.sha256 = function(string) {
			return sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(string));
		};

		/**
		 * sha256 helper function
		 *
		 * @params hex string
		 */
		this.sha256hex = function(hex) {
			return sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(sjcl.codec.hex.toBits(hex)));
		};

		/**
		 * pbkdf2 helper function
		 *
		 * @params string
		 */
		this.pbkdf2 = function(string, salt, iterations) {
			if (!iterations) iterations = 1000;
			return sjcl.codec.hex.fromBits(sjcl.misc.pbkdf2(string, salt, iterations));
		};

		// private properties
		var
			THIS = this,
			encryptionParams = {
				"v": 1,
				"iter": 1000,
				"ks": 256,
				"ts": 128,
				"mode": "ccm",
				"adata": "",
				"cipher": "aes"
			},
			eccKeys,
			ecdsaKeys,
			keyCache = {},
			workspaceKeys = {}
			;

		/**
		 * Check if the internal eccKeys are OK
		 */
		var checkKeys = function() {
			if (!eccKeys || !eccKeys.pub || !eccKeys.sec) {
				throw new Error('Keys have not been initialized');
			}
		};

		/**
		 * xor 8 byte integers (256 bit)
		 *
		 * @param x BitArray
		 * @param y BitArray
		 * @returns BitArray
		 */
		var _xor8 = function(x,y) {
			return [x[0]^y[0],x[1]^y[1],x[2]^y[2],x[3]^y[3],x[4]^y[4],x[5]^y[5],x[6]^y[6],x[7]^y[7]];
		};
	};
}());
