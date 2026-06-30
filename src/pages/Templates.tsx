import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { FiEdit2, FiSend, FiTrash2, FiX } from "react-icons/fi";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { useAppContext, type SmsTemplate } from "../context/AppContext";

type OutletContext = { search: string };
type TemplateCategory = SmsTemplate["category"];

const categories: TemplateCategory[] = ["maintenance", "offer", "service", "payment", "general"];

function CategoryBadge({ category }: { category: TemplateCategory }) {
  return <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium capitalize text-green-700">{category}</span>;
}

export function Templates() {
  const { search } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const { smsTemplates, addTemplate, updateTemplate, deleteTemplate } = useAppContext();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("general");
  const [message, setMessage] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null);
  const [alert, setAlert] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const filteredTemplates = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return smsTemplates;
    return smsTemplates.filter((template) =>
      `${template.title} ${template.category} ${template.message}`.toLowerCase().includes(query),
    );
  }, [search, smsTemplates]);

  const resetForm = () => {
    setTitle("");
    setCategory("general");
    setMessage("");
    setEditingTemplate(null);
  };

  const saveTemplate = async () => {
    setIsSaving(true);
    const result = editingTemplate
      ? await updateTemplate(editingTemplate.id, { title, category, message })
      : await addTemplate({ title, category, message });
    setIsSaving(false);
    if (!result.ok) {
      setAlert(result.error);
      return;
    }
    setAlert("");
    resetForm();
  };

  const startEdit = (template: SmsTemplate) => {
    setEditingTemplate(template);
    setTitle(template.title);
    setCategory(template.category);
    setMessage(template.message);
    setAlert("");
  };

  const removeTemplate = (template: SmsTemplate) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      deleteTemplate(template.id)
        .then(() => {
          if (editingTemplate?.id === template.id) resetForm();
        })
        .catch((error) => {
          setAlert(error instanceof Error ? error.message : "Unable to delete template.");
        });
    }
  };

  const useTemplate = (template: SmsTemplate) => {
    navigate("/sms", { state: { templateMessage: template.message } });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_.75fr]">
      <div className="grid gap-4 md:grid-cols-2">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">{template.title}</h2>
                <div className="mt-2">
                  <CategoryBadge category={template.category} />
                </div>
              </div>
            </div>
            <p className="mt-4 line-clamp-3 text-sm font-medium leading-6 text-slate-600">{template.message}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button className="px-3 py-2" onClick={() => useTemplate(template)}>
                <FiSend />
                Use Template
              </Button>
              <Button variant="secondary" className="px-3 py-2" onClick={() => startEdit(template)}>
                <FiEdit2 />
                Edit
              </Button>
              <Button variant="danger" className="px-3 py-2" onClick={() => removeTemplate(template)}>
                <FiTrash2 />
                Delete
              </Button>
            </div>
          </Card>
        ))}
        {!filteredTemplates.length && (
          <Card className="p-8 text-center md:col-span-2">
            <p className="font-semibold text-slate-500">No templates match your search.</p>
          </Card>
        )}
      </div>

      <div className="space-y-5">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-950">{editingTemplate ? "Edit Template" : "Create Template"}</h2>
            {editingTemplate && (
              <button onClick={resetForm} className="cursor-pointer rounded-full p-2 text-slate-500 hover:bg-slate-100">
                <FiX />
              </button>
            )}
          </div>
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-900">Template Title</span>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Template title" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-900">Category</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as TemplateCategory)}
                className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item[0].toUpperCase() + item.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-900">Message</span>
              <Textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={6} placeholder="Template message" />
            </label>
            <Button className="w-full py-4" onClick={saveTemplate} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </Card>
        {alert && <Alert message={alert} />}
      </div>
    </div>
  );
}
