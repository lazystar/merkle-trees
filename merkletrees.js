import crypto from 'crypto';

function hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

function buildMerkleTree(hashedEmails) {
    if (hashedEmails.length === 1) return {tree: hashedEmails, root: hashedEmails[0]};

    const nextLevel = [];
    for (let i = 0; i < hashedEmails.length; i += 2) {
        const left = hashedEmails[i];
        const right = i + 1 < hashedEmails.length ? hashedEmails[i + 1] : left;
        nextLevel.push(hashData(left + right));
    }

    return buildMerkleTree(nextLevel);
}

function generateMerkleProof(email, hashedEmails) {
    const targetHash = hashData(email);
    let index = hashedEmails.indexOf(targetHash);
    if (index === -1) {
        return null;
    }

    const proof = [];
    while (hashedEmails.length > 1) {
        let pairIndex = (index % 2 === 0) ? (index + 1) : (index - 1);
        if (pairIndex >= hashedEmails.length) {
            pairIndex = index;
        }
        proof.push({hash: hashedEmails[pairIndex], position: pairIndex > index ? 'right' : 'left'});

        // Prepare for the next level
        index = Math.floor(index / 2);
        hashedEmails = hashedEmails.reduce((acc, _, i, src) => {
            if (i % 2 === 0) {
                const left = src[i];
                const right = i + 1 < src.length ? src[i + 1] : left;
                acc.push(hashData(left + right));
            }
            return acc;
        }, []);
    }

    return proof;
}

function verifyEmail(email, proof, root) {
    let computedHash = hashData(email);
    proof.forEach(({hash, position}) => {
        const pair = position === 'left' ? hash + computedHash : computedHash + hash;
        computedHash = hashData(pair);
    });

    return computedHash === root;
}

const emailList = ["marco@example.com", "jenna@example.com", "tanay@example.com"];
const hashedEmails = emailList.map(hashData);
const {tree, root} = buildMerkleTree(hashedEmails);

const targetEmail = "marco@example.com";
const proof = generateMerkleProof(targetEmail, hashedEmails);

if (proof) {
    console.log("Merkle Proof for", targetEmail, ":", proof);
    const isValid = verifyEmail(targetEmail, proof, root);
    console.log("Email", targetEmail, "is valid:", isValid);
} else {
    console.log("Email not found in the tree.");
}