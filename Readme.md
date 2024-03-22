# Beyond Trust: Building Secure Verification with `Merkle Trees`

![Building Secure Verification with `Merkle Trees`](merkle-trees.png)

Ever wondered how large platforms efficiently verify massive datasets?
`Merkle Trees` and `Merkle Proofs` are ingenious tools that come into play for tasks like ensuring the integrity of data.

In the world of blockchain technology, Merkle trees play a crucial role in securing transaction records. By incorporating them into the blockchain structure, they allow for efficient verification of the entire transaction history, even for massive datasets, while maintaining immutability and tamper-proof records.

In this blog post, we'll explore what `Merkle Trees` are and how they can be used to validate data using built-in Javascript libraries like Node's [`crypto`](https://nodejs.org/api/crypto.html).
We'll assume some basic JavaScript knowledge, but no prior experience with `Merkle Trees` is required.

## So, What are `Merkle Trees`?

Imagine a giant family tree, but instead of names, you have data points, like transaction ids or email addresses, at the leaves.
A `Merkle Tree` is a hierarchical structure where each email address is hashed (converted into a unique string) and stored at the bottom.
As you move up the tree, these hashes are combined and hashed again.
This process continues until you reach the top, where you have a single hash value, called the root hash.

The beauty of `Merkle Trees` lies in their efficiency.
Verifying a specific data points (like finding someone in your family tree) doesn't require checking the entire list.
Instead, we use `Merkle Proofs`.

## `Merkle Proofs`: The Verification Path

Think of a `Merkle Proof` as a special document proving someone's lineage in the family tree.
It contains the hashes of sibling nodes at each level along the path from the specific email address to the root hash.

Here's the magic: by following the `Merkle Proof` and hashing the sibling nodes together at each level, we can recreate the root hash.
If this recreated root hash matches the known root hash for the entire `Merkle Tree`, then we can be absolutely sure the email address is genuinely part of the original list and we reduced the verification complexity from `O(n)` to `O(log n)`! 

## Benefits of `Merkle Trees` and `Merkle Proofs`

- **Efficiency:** Verifying large data sets becomes significantly faster compared to checking each data point individually.
- **Security:** Any change to a data point would alter its hash, and ripple up the tree, changing the root hash. This makes it easy to detect tampering.
- **Privacy:** `Merkle Proofs` only reveal the path to the specific data point being verified, not the entire list, which can be crucial for privacy-sensitive data. 

## Validating Emails with Javascript: Code Examples

Let's put theory into practice using Javascript's built-in `crypto` library for hashing and some basic array manipulation.
We will build a the `Merkle Tree` and the `Merkle Proofs` for a list of email addresses.

### 1. Hashing Email Addresses:

```javascript
import crypto from 'crypto';

function hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

const emailList = ["marco@example.com", "jenna@example.com", "tanay@example.com"];
const hashedEmails = emailList.map(email => hashData(email));

console.log(hashedEmails);
```

This code snippet defines a hashEmail function that uses the `crypto` library's `sha256` hashing algorithm to convert email addresses into unique hash strings.
We then apply this function to each email address in our sample list and store the resulting hashes in a new `hashedEmails` array.

### 2. Building the `Merkle Tree`:

```javascript
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

const { tree, root } = buildMerkleTree(hashedEmails);

console.log("Root Hash:", root);
```

This code builds the `Merkle Tree` recursively. It iterates through the `hashedEmails` array, combining and hashing adjacent email address hashes to create the next level of the tree.
(Note: If there's an odd number of elements, the last element is hashed with itself.)
The function then calls itself with the newly formed level until we reach the top and obtain the final root hash.

### 3. Generating a `Merkle Proof`:

```javascript
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

const targetEmail = "marco@example.com";
const proof = generateMerkleProof(targetEmail, hashedEmails, root);

console.log("`Merkle Proof` for", targetEmail, ":", proof);
```

This code defines a `generateMerkleProof` function that takes the target email address, the original `hashedEmails` list, and the root hash as input.
It creates a proof array to store sibling node hashes along the verification path.
It then iterates through progressively smaller levels of the `Merkle Tree` while searching for the target email's hash or derived hash for the respective level.

At each level:

- The index of the target email's hash is identified.
- The sibling node's hash (at the same level) is added to the proof array with its relative position (left/right).
- The next level of the tree is constructed by hashing adjacent elements in the current level.

The loop continues until we reach the root level.
If the final hash in the working list doesn't match the root hash, an error is thrown indicating an invalid email or a corrupted `Merkle Tree`.
Finally, the function returns the proof array containing the sibling node hashes for verification.

### 4. Verifying the Email Address:

```javascript
function verifyEmail(email, proof, root) {
    let computedHash = hashData(email);
    proof.forEach(({hash, position}) => {
        const pair = position === 'left' ? hash + computedHash : computedHash + hash;
        computedHash = hashData(pair);
    });

    return computedHash === root;
}

const isValid = verifyEmail(targetEmail, proof, root);
    console.log("Email", targetEmail, "is valid:", isValid);
```

The verifyEmail function takes the target email, the generated proof, and the root hash as input.
It starts with the target email's hash and iterates through the proof array. At each step:

- The current hash and the sibling hash from the proof are combined and hashed again.

This process essentially recreates the path up the `Merkle Tree`.
Finally, the function compares the resulting hash with the root hash.
If they match, it confirms that the target email is indeed a genuine member of the original email list with the provided root hash.

Check out the full example [here](merkletrees.js) and run it with

```
node merkletrees.js
```

## Conclusion

`Merkle Trees` and `Merkle Proofs` offer a powerful and efficient way to verify data integrity in large datasets.
This blog post provided a basic understanding of these concepts and demonstrated their application in validating email addresses using Javascript's `crypto` library.
Other popular JavaScript/Typescript libraries for `Merkle Trees` in the crypto world are [`merkletreejs`](https://www.npmjs.com/package/merkletreejs) or [`Open Zepplin/merkle-tree`](https://github.com/OpenZeppelin/merkle-tree).
With this knowledge, you can explore more complex use cases and libraries for implementing `Merkle Trees` in your own Javascript projects.

If you want to learn more about different usages of `Merkle Trees`:

- [Merkle Proofs for Offline Data Integrity](https://ethereum.org/en/developers/tutorials/merkle-proofs-for-offline-data-integrity/)
- [Merkle Tree and Bitcoin](https://coingeek.com/merkle-tree-and-bitcoin/)
- [Wikpedia](https://en.wikipedia.org/wiki/Merkle_tree) 😉

and checkout the [Safe Blog](https://safe.global/blog) to learn more about what's happening in the crypto space.