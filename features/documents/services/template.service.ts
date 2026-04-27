import { db } from "@/lib/firebase/config"
import { storage } from "@/lib/firebase/storage"
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  Timestamp,
  deleteDoc,
  updateDoc,
} from "firebase/firestore"
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage"
import { fileService } from "./file.service"

export interface TemplateField {
  key: string
  label: string
  type: "text" | "textarea" | "image" | "date" | "phone"
}

export interface DocumentTemplate {
  id?: string
  name: string
  fileUrl: string
  storagePath: string
  fields: TemplateField[]
  ownerId: string
  category?: string
  subcategory?: string
  authorId?: string
  authorName?: string
  createdAt: Timestamp
}

const TEMPLATES_COLLECTION = "doc_templates"

export const templateService = {
  async saveTemplate(template: Omit<DocumentTemplate, "id" | "createdAt">) {
    const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), {
      ...template,
      createdAt: Timestamp.now(),
    })
    return docRef.id
  },

  async uploadTemplateFile(file: File, userId: string) {
    const validation = fileService.validateTemplateFile(file)
    if (!validation.ok) throw new Error(validation.message)

    const safeFileName = fileService.sanitizeFileName(file.name)
    const storagePath = `templates/${userId}/${Date.now()}_${safeFileName}`
    const storageRef = ref(storage, storagePath)
    await uploadBytes(storageRef, file, {
      contentType: fileService.getUploadContentType(file),
    })
    const fileUrl = await getDownloadURL(storageRef)
    return { fileUrl, storagePath }
  },

  async uploadGeneratedFile(blob: Blob, fileName: string, userId: string) {
    const safeFileName = fileService.sanitizeFileName(fileName)
    const storagePath = `reports/${userId}/${Date.now()}_${safeFileName}`
    const storageRef = ref(storage, storagePath)
    await uploadBytes(storageRef, blob, {
      contentType: blob.type || "application/octet-stream",
    })
    const fileUrl = await getDownloadURL(storageRef)
    return { fileUrl, storagePath }
  },

  async getTemplates(userId: string) {
    const q = query(
      collection(db, TEMPLATES_COLLECTION),
      where("ownerId", "==", userId)
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as DocumentTemplate[]
  },

  async getTemplateById(id: string) {
    const docRef = doc(db, TEMPLATES_COLLECTION, id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as DocumentTemplate
    }
    return null
  },

  async deleteTemplate(id: string, storagePath: string) {
    await deleteDoc(doc(db, TEMPLATES_COLLECTION, id))

    if (storagePath && storagePath.trim() !== "") {
      try {
        const storageRef = ref(storage, storagePath)
        await deleteObject(storageRef)
      } catch (err) {
        console.warn(
          "Could not delete physical file from Storage, it might have been moved or already deleted.",
          err
        )
      }
    }
  },

  async updateTemplate(id: string, updates: Partial<DocumentTemplate>) {
    const docRef = doc(db, TEMPLATES_COLLECTION, id)
    await updateDoc(docRef, updates)
  },
}
