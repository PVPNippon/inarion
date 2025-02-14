import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
export const generatePdf = async (elementId) => {
  const element = document.getElementById(elementId)
  if (!element) throw new Error(`Element with element id ${elementId} not found`)
  const canvas = await html2canvas(element, {
    scale: 2,
  })
  const data = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [129, 70] })
  const imgProperties = pdf.getImageProperties(data)
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = (imgProperties.height * pdfWidth) / imgProperties.width
  pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight)
  pdf.save('download.pdf')
}
