/**
 * Loader / skeleton spinner.
 * @param {boolean} fullScreen  — centre on the full viewport if true
 */
export default function Loader({ fullScreen = false }) {
    const cls = fullScreen
        ? 'loader-wrapper loader-wrapper--full'
        : 'loader-wrapper';

    return (
        <div className={cls}>
            <div className="loader-ring">
                <div /><div /><div /><div />
            </div>
        </div>
    );
}
