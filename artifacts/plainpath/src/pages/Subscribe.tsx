import { useEffect } from "react"

export default function Subscribe() {
  useEffect(() => {
    window.location.replace("/#pricing")
  }, [])

  return null
}
