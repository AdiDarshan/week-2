type ErrorToastProps = {
  message: string;
};

export function ErrorToast({ message }: ErrorToastProps) {
  return <div className="error-toast">❌ {message}</div>;
}
