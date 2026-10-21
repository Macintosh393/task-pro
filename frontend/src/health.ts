export function getStatusMessage(status: string): string {
  if (status === 'ok') {
    return 'Backend connected'
  }

  return 'Backend unavailable'
}
