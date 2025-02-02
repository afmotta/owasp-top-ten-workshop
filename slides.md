---
theme: slidev-theme-nearform
layout: default
highlighter: shiki
lineNumbers: false
---

<img class=logo src="/images/nearform.svg">

# OWASP Top Ten Security Vulnerabilities Workshop

<img src="/assets/owasp.png" style="width: 30%;">

<div class="copyright">

© Copyright 2022 NearForm Ltd. All Rights Reserved.

</div>

---

# Introduction: OWASP

<div class="dense">

- The Open Web Application Security Project (OWASP) is a nonprofit foundation that works to improve the security of software

- OWASP has community-led open-source software projects, hundreds of local chapters worldwide, tens of thousands of members, and leading educational and training conferences

</div>

---

# Introduction: OWASP Top Ten

<div class="dense">

- The [OWASP Top Ten](https://owasp.org/Top10/) is a standard awareness document for developers and web application security
- It represents a broad consensus about the most critical security risks to web applications

</div>

---

# Workshop Setup

<div class="dense">

- This workshop will explain each of the 10 vulnerabilities
- There is a Fastify node.js server demonstrating the security issues
- At each step you are asked to fix the vulnerability in the server
- You will find the solution to each step in the `src/a{n}-{name}` folder
- The 💡 icon indicates hints

</div>

---

# Getting setup

<div class="dense">

#### Requirements

<br />

- Node LTS
- docker
- docker-compose
- Postman (if you want to be able to test vulnerabilities)

#### Setup

<br />

```bash
git clone https://github.com/nearform/owasp-top-ten-workshop
npm ci
npm run db:up
npm run db:migrate
```

</div>

---

# Running the modules

<div class="dense">

- `cd src/a{x}-step-name`
- `npm start` will run the server ready to respond to requests
- `npm run verify` will run automated tests that fail by default until this step's issue is solved
- Check out README.md in the projects for potential additional info

</div>

### Example

```bash
cd src/a-01-access-control
npm start
```

The server for that step will run on http://localhost:3000

---

# Testing the vulnerabilities

<div class="dense">

- Some vulnerabilities involve sending specific requests to the server. We will be using the tool Postman to send those requests
- The `postman` folder contains a collection that can be imported into Postman to easily send those requests
- The Postman collection is pre-logged in with user `alice`

</div>

---

# Automated testing

<div class="dense">

- Some vulnerabilities have automated tests which verify the presence of the vulnerability
- Those tests will fail until you fix the vulnerability
- `npm run verify` in a step's folder

</div>

---

# A01: Broken Access Control

<div class="dense">

- [AO1:2021 - Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- User should only act based on specific permissions
- Incorrect permissions -> unauthorised access of data
</div>

---

# A01 Broken Access Control (2): Common vulnerabilities

<div class="dense">

- Not applying principle of least privilege
- Checks can be bypassed by tampering with page or request
- Allowing access to someone else's info by knowing the UUID
- CORS allows untrusted origins

</div>

---

# A01 Broken Access Control (3): How to Prevent

<div class="dense">

- Deny access by default
- Avoid duplication of access control logic
- Enforce user ownership when manipulating data

</div>

---

# A01 Exercise

<div class="dense">

- The `/profile` route returns sensitive user data
- It takes a `username` query parameter to return the user's info

```
GET http://localhost:3000/profile?username=alice
```

```json
{
  "id": 1,
  "username": "alice",
  "age": 23
}
```

</div>

---

# A01 Exercise (2): The problem

<div class="dense">

- Run the server for step 1 (`cd src/a01-access-control`, `npm start`)
- In Postman, run the query for A01: Access Control. Observe the data for Alice being returned
- Now change the `username` query parameter to `bob`. Result:

```json
{
  "id": 2,
  "username": "bob",
  "age": 31
}
```

- Bob's data is being exposed! Remember we're logged in as Alice and shouldn't see Bob's data

</div>

---

# A01 Exercise (3): Fixing it

<div class="dense">

- Run the automated tests for step 1 - `npm run verify`
- The tests fail because the server shouldn't return Bob's data
- Edit the `/profile` route in the exercise folder to return the user's profile without exposing other people's profiles
- 💡 The server uses [fastify-jwt](https://github.com/fastify/fastify-jwt) to handle authentication

</div>

---

# A01 Exercise (4): Solution

<div class="dense">

- The issue comes from the usage of a user-supplied `query` parameter to choose which profile's info to check
- The server should instead fetch the logged-in user's info

```js
// routes/profile/index.js
export default async function user(fastify) {
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate]
    },
    async req => {
      if (!req.user) {
        throw new errors.Unauthorized()
      }
      // We get the username from the logged in user, not from the query
      const username = req.user.username // 💡 <-- The fix is here!
      // (Skipping the rest of the function...)
      return user
    }
  )
}
//...
```

</div>

---

# A02: Cryptographic Failures

<div class="dense">

- [A02: Cryptographic Failures](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
- Weak or inexistent cryptography of sensitive data
- Passwords, credit card numbers, health records, personal information, business secrets...
- Anything protected by privacy laws or other regulations

</div>

---

# A02 Cryptographic Failures (2): Common vulnerabilities

<div class="dense">

- Weak or outdated cryptographic algorithms like md5
- Weak secret keys, default ones, keys from online tutorials, keys checked in source control...
- Lack of traffic encryption (HTTPS)
- Insufficient entropy in seed generation

</div>

---

# A02 Cryptographic Failures (3): How to Prevent

<div class="dense">

- Check sensitive data is well encrypted. Avoid storing sensitive data unnecessarily
- Use up to date and strong standard algorithms
- Proper key/secrets management (no checking private keys in git)
- Disable caching for responses that contain sensitive data

</div>

---

# A02 Exercise: a weak hashing algorithm

<div class="dense">

- The `/all-data` endpoint returns all users and their passwords (encrypted in md5). Imagine this as a data breach
- Result of the `all-data` endpoint

```json
[
  {
    "username": "bob",
    "password": "884a22eb30e5cfd71894d43ac553faa5"
  },
  {
    "username": "alice",
    "password": "5e9d11a14ad1c8dd77e98ef9b53fd1ba"
  }
]
```

</div>

---

# A02 Exercise (2): The problem

<div class="dense">

- Using the `/all-data` route, find Alice's encrypted password
- With this encrypted password hash, try to find the original unencrypted password Alice created
- the Postman collection contains requests for doing the queries
- 💡 There are websites to decrypt md5

</div>

---

# A02 Exercise (3): Fixing it

<div class="dense">

- md5 encryption is vulnerable and shouldn't be used
- In `src/a02-cryptographic-failure`, fix the encryption used to be a strong algorithm instead of md5
- Using [bcrypt](https://www.npmjs.com/package/bcrypt) is a good idea for passwords
- The application exposes a `/change-password` route used to change a user's password
- Make sure the tests pass: `npm run verify`

</div>

---

# A02 Exercise (4): Solution

<div class="dense">

```js
// utils/encryption.js
import { hash, compare } from 'bcrypt'

const saltRounds = 10

export async function encryptPassword(password) {
  return await hash(password, saltRounds)
}

export async function comparePassword(password, hash) {
  return await compare(password, hash)
}
```

</div>

---

# A03: Injection 💉

<div class="dense">

- Injections are a form of attack where a malicious payload is able to effectively inject an arbitrary bit of query or code on the target server
- Injections can result in data loss or corruption, lack of accountability, or denial of access. Injections can sometimes lead to complete host takeover.
- Common targets: **SQL, NoSQL, ORM, LDAP, JS eval**

</div>

---

# A03 Injection 💉: Common vulnerabilities

<div class="dense">

- Lack of validation or **sanitization** of user input
- Dynamic queries or non-parameterized calls without context-aware **escaping** are used directly in the interpreter
- Hostile data is used within object-relational mapping (ORM) **search parameters** to extract additional, sensitive records

</div>

---

# A03 Injection 💉: Attack

<div class="dense">

- Run the server for step 3 (`cd src/a03-injection`, `npm start`)
- In Postman, run the query for `A03: Get customer by name`. Observe the data for `name: "alice"` being returned
- Try to run the query for `A03: SQL Injection`. Observe all the customers being returned
- The query param value `' OR '1'='1` takes advantage of the unsafe string concatenation to create this SQL query
  `SELECT * FROM customers WHERE name='' OR '1'='1'` which will return every record in the table

</div>

---

# A03 Injection 💉: Fixing it

<div class="dense">

- Prefer using a safe API that **sanitizes input** e.g `@nearform/sql`
- **Escape special characters** using the specific escape syntax for that interpreter
- Avoid user-supplied table names or column names as they cannot be escaped
- **Automated testing** of all parameters, headers, URL, cookies, JSON, SOAP, and XML data inputs is strongly encouraged

</div>

---

# A03 Injection 💉: Solution

<div class="dense">

- The `@nearform/sql` library escapes special characters contained in the user's input

```js
// import SQL from '@nearform/sql'
export default async function customer(fastify) {
  fastify.get(
    '/customer',
    {
      onRequest: [fastify.authenticate]
    },
    async req => {
      const { name } = req.query
      const { rows: customers } = await fastify.pg.query(
        SQL`SELECT * FROM customers WHERE name=${name}`
      )
      if (!customers.length) throw errors.NotFound()
      return customers
    }
  )
}
```

</div>

---

# A04: Insecure Design

<div class="dense">

- Fundamental design flaws of the software can cause security issues
- Those issues cannot be fixed by a better more secure code implementation
- Failure to determine the level of security required during design

</div>

---

# A04 Insecure Design: Examples

<div class="dense">

- A forgotten password flow with "security questions" is insecure by design because more than one person can know the answer
- An ecommerce website sells high-end video cards that scalpers buy with bots to resell (bad PR with customers). Most websites wouldn't need to design against bots, but due to the nature of the product being sold this one does
- A cinema chain allows booking up to fifteen attendees before requiring a deposit. An attacker could make hundreds of small booking requests at once to block all seats, causing massive revenue loss

</div>


---

# A04 Insecure Design: How to prevent

<div class="dense">

- Model threats for the application, all its flows and business logic
- Continuously evaluate security requirement and design during the development lifecycle
- Consider security rules and access controls for every user story
- Use unit and integration tests to verify the application is resistant to the threat model

</div>

---

# A04 Exercise

<div class="dense">

- The `/buy-product` endpoint does not have protection against bots run by scalpers
- It means that someone can buy a lot of stock quickly and leave legitimate customers without any

</div>

---

# A04 Exercise: Simulating multiple purchases in a short time frame

<div class="dense">

- Run the server for step 4 (`cd src/a04-insecure-design`, `npm start`)
- In Postman, run the query for `A04: Buy product`. Observe the data for `success: true` being returned
- Run the query many times in a row in a short period of time
- Notice that there is no protection against multiple sequential purchases
</div>

---

# A04 Exercise: Fixing it

<div class="dense">

- Prefer using rate limiter for your routes
- Using [`fastify-rate-limit`](https://github.com/fastify/fastify-rate-limit) is a good idea for setting a rate limit
- Let's consider a scenario where a user can buy a maximum of two products per minute
- Edit the `/buy-product` route in the exercise folder considering the scenario above
- Make sure the tests pass: `npm run verify`

</div>

---

# A04 Exercise: Solution

<div class="dense">

```js
// register the rateLimit plugin in the server.js file
await fastify.register(rateLimit)
```

```js
// the rate limit is set to a maximum of two purchases per minute
export default async function ecommerce(fastify) {
  fastify.post(
    '/buy-product',
    {
      config: {
        rateLimit: {
          max: 2,
          timeWindow: '1 minute'
        }
      }
    },
    (req, reply) => {
      reply.send({ success: true })
    }
  )
}
```

</div>

---

# A05: Security Misconfiguration

<div class="dense">

- Security misconfigurations are security controls that are inaccurately configured or left insecure, putting your systems and data at risk
- Badly configured servers or services can lead to vulnerabilities
- With increased usage of highly configurable software and cloud APIs, there are many opportunities for misconfiguration

</div>

---

# A05 Security Misconfiguration: Common Vulnerabilities

<div class="dense">

- Improperly configured permissions or security settings
- Unnecessary features enabled: open ports, services, accounts with elevated accesss...
- Default credentials unchanged
- Out of date or vulnerable server
- Stack trace from error handling revealing information to users

</div>

---

# A05 Security Misconfiguration: How to prevent

<div class="dense">

- Repeatable, automated and fast to deploy environments
- Different credentials should be used in each environment
- Frequently review security updates, patches and permissions
- A segmented architecture increases security by separating components, tenants, containers or cloud security groups
- An automated process to verify the effectiveness of the configurations

</div>

---

# A05 Security Misconfiguration: Unsigned Cookies

<div class="dense">

- Run the server for step 5 (`cd src/a05-security-misconfiguration`, `npm start`)
- In Postman, run the query for `A05: Login`. Observe a cookie with `userId=1` being returned
- Try to run the query for `A05: Profile`. Observe the information about profile with `userId=1` being returned
- Try to change the value of the cookie to `userId=2`. Observe information about `userId=2` being returned

</div>

---

# A05 Security Misconfiguration: Fixing it

<div class="dense">

- Cookie must always be **[signed](https://github.com/fastify/fastify-cookie)** to ensure they are not getting tampered with on client-side by an attacker
- It's important to use **httpOnly** cookies to prevent the cookie being accessed through client side script
- Store the **signing secret** safely.
- Don't store sentive information in cleartext

</div>

---

# A05 Security Misconfiguration: Solution

<div class="dense">

```js
export function login(fastify) {
  fastify.post('/login', { schema }, async (req, rep) => {
    const { username, password } = req.body
    const {
      rows: [user]
    } = await fastify.pg.query(
      SQL`SELECT id, username, password FROM users WHERE username = ${username}`
    )
    if (!user) {
      throw errors.Unauthorized('No matching user found')
    }
    const passwordMatch = await comparePassword(password, user.password)
    if (!passwordMatch) {
      throw errors.Unauthorized('Invalid Password')
    }
    rep.setCookie('userId', JSON.stringify(user.id), {
      signed: true, // signing the cookie
      httpOnly: true // http only
    })
    return 'user logged in'
  })
}
```

</div>

---

# A05 Security Misconfiguration: Solution (2)

<div class="dense">

```js
export function profile(fastify) {
  fastify.get('/profile', async req => {
    const { value: id, valid } = fastify.unsignCookie(
      //unsign the cookie and check validity
      req?.cookies?.userId || ''
    )

    if (!valid) {
      // check if the cookie has been tampered
      throw new errors.Unauthorized()
    }
    const {
      rows: [user]
    } = await fastify.pg.query(
      SQL`SELECT id, username, age FROM users WHERE id = ${id}`
    )
    if (!user) {
      throw new errors.NotFound()
    }
    return user
  })
}
```

</div>

---

# A06: Vulnerable and Outdated Components

<div class="dense">

- Applications use a variety of components and libraries which can have security issues
- Vulnerable components can be an attack vector until they are patched
- Particularly relevant in the node.js world with an ever-growing NPM dependency tree

</div>

---

# A06 Vulnerable and Outdated Components: Common Vulnerabilities

<div class="dense">

- Not tracking versions of used components, including nested dependencies
- Using unsupported or vulnerable software, including OS, web server, database, APIs, libraries, components, runtimes...
- Not scanning for vulnerabilities regularly and subscribing to security news for used components
- Not fixing vulnerable dependencies in a timely fashion

</div>

---

# A06 Vulnerable and Outdated Components: How to prevent

<div class="dense">

- Remove unused dependencies, unnecessary features, components, files, and documentation
- Continuously inventory the versions of components and their dependencies
- Monitor for libraries and components that are **unmaintained** or do not create security patches for older versions
- Only obtain components from **official** sources over secure links

</div>

---

# A06 Vulnerable and Outdated Components: The SSRF attack

<div class="dense">

- Run the server for step 6 (`cd src/a06-vulnerable-outdated`, `npm start`)
- In Postman, run the query for `A06: Profile`. Observe error `404` being returned
- Try to run the query for `A06: SSRF`. Observe the response **"message": "connect ECONNREFUSED 127.0.0.1:80"**
</div>

---

# A06 Vulnerable and Outdated Components: The SSRF attack (2)

<div class="dense">

- Because of an outdated version of the HTTP client library **[undici](https://github.com/nodejs/undici)** we can exploit a known **[vulnerability](https://www.cvedetails.com/cve/CVE-2022-35949/)**
- By passing the value `//127.0.0.1` in the username query param, we override the original hostname and we can make the server perform a GET to `127.0.0.1:80`
</div>

---

# A06 Vulnerable and Outdated Components: Fixing it

<div class="dense">

- Validate user input before passing it to the `undici.request` call.
- Update the library to a version in which this vulnerability was fixed

</div>

---

# A06 Vulnerable and Outdated Components: The Solution

<div class="dense">

```js
import { request } from 'undici' // updated undici version >= 5.8.1
export default function (fastify) {
  fastify.get(
    '/profile',
    {
      onRequest: [fastify.authenticate]
    },
    async req => {
      const { username } = req.query
      if (/^\//.test(username)) {
        // check username doesn't start with /
        throw errors.BadRequest()
      }
      const { body, statusCode } = await request({
        origin: 'http://example.com',
        pathname: username
      })
      if (statusCode !== 200) {
        throw errors.NotFound()
      }
      return body
    }
  )
}
```

</div>

---

# A07: Identification and Authentication Failures

<div class="dense">

- Verification of the user's identity, authentication, and session management is crucial to security
- Weak or vulnerable authentication systems can be exploited to gain access
- Systems with broken authentication can lead to data breaches and passwords leak

</div>

---

# A07 Identification and Authentication Failures: Common Vulnerabilities

<div class="dense">

- Application allows for credentials stuffing or brute forcing
- Allows default, weak or known passwords
- Exploitable credential recovery processes
- Lack of effective multi-factor authentication
- Unencrypted or weakly encrypted password storage

</div>

---

# A07 Identification and Authentication Failures: How to prevent

<div class="dense">

- Where possible, implement multi-factor authentication
- Require strong passwords (length, complexity, rotation policies, and don't allow leaked passwords use)
- Ensure registration and credential recovery use the same messages for all outcomes
- Limit or increasingly delay failed login attempts
- Use secure password data store practices (salting + hashing)

</div>

---

# A07 Identification and Authentication Failures: Allowing leaked passwords (1)

<div class="dense">

- In 2017 the NIST **[recommended](https://pages.nist.gov/800-63-3/sp800-63b.html#sec4:~:text=when%20processing%20requests,a%20different%20value)** that websites should check all new passwords against available lists of data breaches.
- This practice has been adopted by OWASP and became part of their **[recommendation](<https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/#:~:text=Align%20password%20length%2C%20complexity%2C%20and%20rotation%20policies%20with%20National%20Institute%20of%20Standards%20and%20Technology%20(NIST)%20800%2D63b%27s%20guidelines%20in%20section%205.1.1%20for%20Memorized%20Secrets%20or%20other%20modern%2C%20evidence%2Dbased%20password%20policies.>)**.
- In the real scenario you should try to use something like **[Have I Been Pwned](https://haveibeenpwned.com/Passwords)**

</div>

---

# A07 Identification and Authentication Failures: Allowing leaked passwords (2)

<div class="dense">

- In the workshop - the database contains the list of leaked passwords in `databreachrecords`
- Run the server for step 7 (`cd src/a07-authentication-failures`, `npm start`)
- In Postman, run the query for `A07: Register`. Observe a token is succesfully returned
- In the database check the `databreachrecords` table for password used in the Postman request body

</div>

---

# A07 Identification and Authentication Failures: Allowing leaked passwords (3)

<div class="dense">

- It should not allow to use passwords that are known to be leaked
- Instead it should require the user to set a different password indicating what is the reason
- Place your solution in the `routes/user/index.js`
- Test it by running `npm run verify` (it will fail initially)

</div>

---

# A07 Identification and Authentication Failures: Fixing it

<div class="dense">

- Using data available in `databreachrecords` check if requested password is safe to use
- Run `sql` query inside the `/register` endpoint to check if the password is there
- Return a `400` error with `message` indicating the source of the leak: `'You are trying to use password that is known to be exposed in data breaches: ${source}. Use a different one. Read more here: https://haveibeenpwned.com/Passwords.'`

</div>

---

# A07 Identification and Authentication Failures: Solution

<div class="dense">

- File containing full solution is in the `routes/user/solution.js`

```js
const {
  rows: [breach]
} = await fastify.pg.query(
  SQL`SELECT * FROM databreachrecords WHERE password=${password}`
)

if (breach) {
  res.send(
    errors.BadRequest(
      `You are trying to use password that is known to be exposed in data breaches: ${breach.source}. Use a different one. Read more here: https://haveibeenpwned.com/Passwords.`
    )
  )
}
```

</div>

---

# A08: Software and Data Integrity Failures

<div class="dense">

- Code and infrastructure not protected against integrity violations
- Attackers gaining access to a plugin and deploy an unverified update which would get distributed to all its users

</div>

---

# A08 Software and Data Integrity Failures: Common Vulnerabilities

<div class="dense">

- Libraries coming from untrusted sources, repos or CDNs
- Deserialization of Untrusted Data, where objects or data are encoded or serialized into a structure that an attacker can see and modify is vulnerable to insecure deserialization
- An insecure CI/CD pipeline
- Updates downloaded without sufficient integrity verification

</div>

---

# A08 Software and Data Integrity Failures: How to prevent

<div class="dense">

- Using digital signatures for integrity checks on data and downloaded software
- Ensure npm dependencies are trusted. For higher risks, host a custom repository of packages with internally vetted dependencies
- Use automated tools to verify that components don't contain known vulnerabilities
- Ensure there are code reviews for changes to minimise the risk of malicious code being introduced

</div>

---

# A08 Exercise - Insecure Deserialization

<div class="dense">

- Run the server for step 8 (`cd src/a08-software-data-integrity-failures`, `npm start`)
- In Postman, try to run the query for `A08: Get profile from cookie`. Observe the requests `status code 500` being returned
- This is happening because the server is deserializing a cookie containing a malicious JavaScript code which is forcing the server to throw an exception
</div>

---

# A08 Exercise - Insecure Deserialization

<div class="dense">

- Untrusted data passed into unserialize() function in `node-serialize` module can be exploited to achieve arbitrary code execution by passing a serialized JavaScript Object with an Immediately invoked function expression (IIFE)
- The step by step to serialize a JavaScript code and insert it in the cookie can be found [in this article](https://opsecx.com/index.php/2017/02/08/exploiting-node-js-deserialization-bug-for-remote-code-execution/)
</div>

---

# A08 Software and Data Integrity Failures: Sulution

<div class="dense">

- JSON.parse is a safer way to deserialize data

```js
export default async function solution(fastify) {
  fastify.get('/profile', req => {
    const cookieAsStr = Buffer.from(req.cookies.profile, 'base64').toString(
      'ascii'
    )

    const profile = JSON.parse(cookieAsStr)

    if (profile.username) {
      return 'Hello ' + profile.username
    }

    return 'Hello guest'
  })
}
```

</div>

---

# A09: Security Logging and Monitoring Failures

<div class="dense">

- Proper logging and monitoring is critical to detecting and responding to breaches
- It is important for alerting, accountability, visibility and forensics of security incidents

</div>

---

# A09: Security Logging and Monitoring Failures: Common Vulnerabilities

<div class="dense">

- Auditable events, such as logins, failed logins, and high-value transactions, are not logged
- Warnings and errors generate no, inadequate, or unclear log messages
- Logs of applications and APIs are not monitored for suspicious activity
- The application cannot detect, escalate, or alert for active attacks in real-time or near real-time

</div>

---

# A09: Security Logging and Monitoring Failures: How to prevent

<div class="dense">

- Ensure all login, access control, and server-side input validation failures can be logged with sufficient user context to identify suspicious or malicious accounts
- Ensure log data is encoded correctly to prevent injections or attacks on the logging or monitoring systems
- Ensure high-value transactions have an audit trail with integrity controls to prevent tampering or deletion, such as append-only database tables or similar.

</div>

---

# A09 Security Logging and Monitoring Failures: Suspicious activity 🤨

<div class="dense">

- Run the server for step 5 (`cd src/a05-security-misconfiguration`, `npm run verify`)
- You can observe a log message `something suspicious is happening`
- Note that the application is using a vulnerable version of the http client **[undici](https://github.com/nodejs/undici/security/advisories/GHSA-f772-66g8-q5h3)**

</div>

---

# A09 Security Logging and Monitoring Failures: How to fix it

<div class="dense">

- Log user input to identify suspicious or malicious accounts
- Validate user input

</div>

---

# A09 Security Logging and Monitoring Failures: Solution

<div class="dense">

```js
// profile route handler
  
  async req => {
      console.log({
        username: req.user.username, // add context to logs to help identify the user
        input: req.headers['content-type']
      })
      const headerCharRegex = /[^\t\x20-\x7e\x80-\xff]/ // validate user input
      if (headerCharRegex.exec(req.headers['content-type']) !== null) {
        throw errors.BadRequest()
      }
      const { body } = await request('http://localhost:3001', {
        method: 'GET',
        headers: {
          'content-type': req.headers['content-type']
        }
      })
      return body
    }
```

 </div>


---

# A10: Server Side Request Forgery

<div class="dense">

- SSRF flaws occur whenever a web application is fetching a remote resource without validating the user-supplied URL
- It allows an attacker to coerce the application to send a crafted request to an unexpected destination, even when protected by a firewall, VPN, or another type of network access control list

</div>

---

# A10: Server Side Request Forgery: How to prevent

<div class="dense">

- Sanitize and validate all client-supplied input data
- Enforce the URL schema, port, and destination with a positive allow list
- Do not send raw responses to clients
- Disable HTTP redirections
- Do not mitigate SSRF via the use of a deny list or regular expression

</div>

---

# A10: Server Side Request Forgery: The Attack

<div class="dense">

- Run the server for step 10 (`cd src/a10-server-side-request-forgery`, `npm start`)
- In Postman, run the query for `A10: Upload Image`. Observe an image being returned
- Try to run the query for `A10: Malicious Image url`. Observe `something suspicious is happening` being returned
- The server is not sanitizing user input so it will send a request to whatever url provided in the payload

</div>

---

# A10: Server Side Request Forgery: How to fix

<div class="dense">

- Sanitize the url making sure it's valid
- Create a whitelist of allowed domains by adding them in the database column `allowedImageDomain`
- Make sure the requested domain is in the whitelist

</div>

---

# A10: Server Side Request Forgery: Solution

<div class="dense">

```js
export default async function profilePicture(fastify) {
  fastify.post(
    '/user/image',
    {
      onRequest: [fastify.authenticate]
    },
    async req => {
      const { imgUrl } = req.body
      const url = validateUrl(imgUrl) // validate url using the URL object
      const {
        rows: [whitelisted]
      } = await fastify.pg.query(
        SQL`SELECT * FROM allowedImageDomain WHERE hostname = ${url.hostname}`
      )
      if (!whitelisted) {
        throw errors.Forbidden()
      }
      const { data } = await axios.get(url.href)
      return data
    }
  )
}
```

</div>

---

# Beyond the Top 10

<div class="dense">

- The OWASP Top 10 is a good introduction to the most common issues to keep in mind while developing
- By its nature, the Top 10 is a series of guidelines but can't be tested easily as its applications are broad
- On the other hand the [OWASP Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/) is a comprehensive list of security criteria
- Those are specific, standardised and verifiable security requirements on which on app can be tested to either pass or fail

</div>

---

# Other useful OWASP resources

<div class="dense">

- The [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org) provides condensed information on specific security topics related to OWASP standards
- The [OWASP Software Assurance Maturity Model](https://owaspsamm.org) can help an organization analyze and improve their software security

</div>

---

# Thanks For Having Us!

## 👏👏👏
