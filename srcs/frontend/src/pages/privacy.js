export default function renderPrivacyPolicy()
{
    const main = document.getElementById("main");
    document.getElementById("header").innerHTML = "";
    
    main.innerHTML = `
        <div class="privacy-policy-container">
            <h1>Privacy Policy</h1>
            <p class="last-updated">Last updated: 17/02/2025</p>

            <h2>1. Introduction</h2>
            <p>Welcome to Transcendence Pong. Your privacy is important to us. This Privacy Policy explains how we collect, use, store, and protect your personal data in accordance with the General Data Protection Regulation (GDPR).</p>

            <h2>2. What Data Do We Collect?</h2>
            <ul>
                <li><strong>Email Address:</strong> Required for account registration, login, and two-factor authentication (2FA).</li>
                <li><strong>Game Data:</strong> Includes match history, rankings, and statistics used for gameplay features.</li>
            </ul>
            <p>We do not collect sensitive personal data, such as financial information, physical location, or biometric data.</p>

            <h2>3. How Do We Use Your Data?</h2>
            <p>We process your data only for the following purposes:</p>
            <ul>
                <li>Authentication & Security – Your email is used for login, account security, and optional 2FA.</li>
                <li>Game Experience – Your match history and statistics are stored to create leaderboards and track progress.</li>
                <li>Customer Support – If you contact us, we may use your email to respond to inquiries.</li>
            </ul>
            <p>We do not use your personal data for marketing, profiling, or automated decision-making.</p>

            <h2>4. Legal Basis for Processing Data</h2>
            <ul>
                <li><strong>Performance of a Contract:</strong> Your data is necessary to provide you with access to Transcendence Pong.</li>
                <li><strong>Legitimate Interest:</strong> Game statistics and rankings enhance the competitive experience.</li>
                <li><strong>Consent:</strong> You provide explicit consent when registering for an account.</li>
            </ul>

            <h2>5. Who Do We Share Your Data With?</h2>
            <p>We do not sell, rent, or share your personal data with third parties. Your data is stored securely and is only accessible to you and the system for essential operations.</p>

            <h2>6. How Long Do We Keep Your Data?</h2>
            <ul>
                <li><strong>Account Data:</strong> Your email and game history are stored as long as your account exists.</li>
                <li><strong>Data Deletion:</strong> When you delete your account, all associated data is permanently erased.</li>
                <li><strong>Inactive Accounts:</strong> We may delete inactive accounts after 1 year of inactivity.</li>
            </ul>

            <h2>7. Your Rights</h2>
            <ul>
                <li><strong>Access:</strong> Request a copy of the data we hold about you.</li>
                <li><strong>Correction:</strong> Update incorrect or incomplete information.</li>
                <li><strong>Deletion (Right to be Forgotten):</strong> Delete your account and all associated data.</li>
                <li><strong>Restriction of Processing:</strong> Request that we limit how we use your data.</li>
                <li><strong>Objection:</strong> Object to data processing in specific circumstances.</li>
            </ul>
            <p>You can manage your data and request deletions in your profile settings or by contacting us.</p>

            <h2>8. Data Security</h2>
            <ul>
                <li><strong>Encryption:</strong> Your data is stored securely using encryption methods.</li>
                <li><strong>Access Control:</strong> Only authorized personnel can access the necessary data.</li>
                <li><strong>Regular Security Audits:</strong> We periodically review security measures to prevent breaches.</li>
            </ul>

            <h2>9. What Happens When You Delete Your Account?</h2>
            <ul>
                <li>Your email and personal data will be permanently deleted.</li>
                <li>Your match history will be anonymized (e.g., your username will be replaced with "Deleted User").</li>
            </ul>
            <p>This action is irreversible—once deleted, your data cannot be recovered.</p>

            <h2>10. Cookies & Tracking</h2>
            <p>We do not use cookies, third-party trackers, or analytics services that collect personal data.</p>

            <h2>11. International Data Transfers</h2>
            <p>We store and process your data within the European Economic Area (EEA). If, in the future, any data is transferred outside the EEA, we will ensure appropriate safeguards are in place.</p>

            <h2>12. Children's Privacy</h2>
            <p>Our services are not intended for users under the age of 16. If we become aware that a child under 16 has provided us with personal data, we will take steps to delete such information immediately.</p>

            <h2>13. Changes to This Privacy Policy</h2>
            <p>We may update this Privacy Policy from time to time. If we make significant changes, we will notify you via email or an in-app notification.</p>

            <h2>14. Contact Information</h2>
            <p>If you have any questions, concerns, or requests regarding your personal data, you can contact us at:</p>
            <p>📧 Email: <a href="mailto:asyvash@student.42angouleme.fr">asyvash@student.42angouleme.fr</a></p>
        </div>
    `;
}
