import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  CloudUpload, 
  FileText, 
  Search, 
  Download, 
  Trash2, 
  CheckCircle, 
  Loader, 
  X,
  Folder,
  BarChart3,
  Clock,
  Target
} from "lucide-react";
import { format } from "date-fns";

export default function Documents() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  interface HRDocument {
    id: string;
    name: string;
    category: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: string;
    isActive: boolean;
    vectorCount: number;
    createdAt: string;
  }

  const { data: documents = [], isLoading } = useQuery<HRDocument[]>({
    queryKey: ['/api/hr-documents'],
    retry: false,
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/hr-documents/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Document Deleted",
        description: "The document has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/hr-documents'] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ file, category }: { file: File; category: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      
      const response = await fetch('/api/hr-documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Upload Complete",
        description: `${variables.file.name} has been processed and added to the knowledge base.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/hr-documents'] });
    },
    onError: (error: Error, variables) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const fileId = file.name;
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
      
      let progressInterval: NodeJS.Timeout | null = null;
      
      try {
        // Show progress
        progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const currentProgress = prev[fileId] || 0;
            if (currentProgress >= 90) {
              if (progressInterval) clearInterval(progressInterval);
              return prev;
            }
            return { ...prev, [fileId]: Math.min(currentProgress + 10, 90) };
          });
        }, 200);

        // Upload to backend
        await uploadDocumentMutation.mutateAsync({
          file,
          category: 'policy',
        });

        if (progressInterval) clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
        
        // Clear progress after 2 seconds
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });
        }, 2000);
      } catch (error) {
        if (progressInterval) clearInterval(progressInterval);
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      }
    }
    
    // Reset the input
    event.target.value = '';
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (doc: HRDocument) => {
    if (!doc.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (doc.vectorCount > 0) {
      return <Badge className="bg-accent/10 text-accent">Active</Badge>;
    }
    return <Badge className="bg-amber-500/10 text-amber-500">Processing</Badge>;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'policy':
        return <FileText className="w-4 h-4 text-primary" />;
      case 'benefits':
        return <Target className="w-4 h-4 text-blue-500" />;
      case 'handbook':
        return <Folder className="w-4 h-4 text-accent" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Calculate total vectors for display
  const totalVectors = documents.reduce((sum, doc) => sum + (doc.vectorCount || 0), 0);
  const totalDocuments = documents.length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardContent className="p-8">
            <div className="h-32 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload HR Documents</CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload policy documents, handbooks, and benefit guides to enhance AI assistant's knowledge
          </p>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-input rounded-xl p-12 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <CloudUpload className="w-10 h-10 text-primary" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Upload HR Documents</h4>
              <p className="text-sm text-muted-foreground mb-4">Select files to upload to the knowledge base</p>
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                data-testid="input-file-upload"
              />
              <Button
                onClick={() => document.getElementById('file-upload')?.click()}
                className="px-6 py-3 mb-4"
                data-testid="button-choose-files"
              >
                <Folder className="w-4 h-4 mr-2" />
                Choose Files
              </Button>
              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, DOCX, TXT • Max file size: 50MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Processing Status */}
      {Object.keys(uploadProgress).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Processing Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {progress < 100 ? (
                    <Loader className="w-6 h-6 text-primary animate-spin" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-accent" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground mb-1">{fileName}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Progress value={progress} className="h-2" />
                    </div>
                    <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                  </div>
                  {progress >= 100 && (
                    <p className="text-xs text-accent mt-1">✓ Processing complete - Added to knowledge base</p>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="p-2">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Document Library */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Document Library</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                  data-testid="search-documents"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="policy">Policies</SelectItem>
                  <SelectItem value="benefits">Benefits</SelectItem>
                  <SelectItem value="handbook">Handbooks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id} className="hover:bg-muted/50" data-testid={`document-row-${doc.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-destructive" />
                          <span className="font-medium">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(doc.category)}
                          <Badge 
                            variant="secondary"
                            className={
                              doc.category === 'policy' ? 'bg-primary/10 text-primary' :
                              doc.category === 'benefits' ? 'bg-blue-500/10 text-blue-500' :
                              doc.category === 'handbook' ? 'bg-accent/10 text-accent' :
                              'bg-muted text-muted-foreground'
                            }
                          >
                            {doc.category}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {doc.fileSize ? `${(doc.fileSize / 1024 / 1024).toFixed(1)} MB` : 'Unknown'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(doc.createdAt), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>{getStatusBadge(doc)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-primary hover:text-primary/80"
                            data-testid={`download-document-${doc.id}`}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-destructive hover:text-destructive/80"
                            onClick={() => deleteDocumentMutation.mutate(doc.id)}
                            disabled={deleteDocumentMutation.isPending}
                            data-testid={`delete-document-${doc.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {searchTerm || selectedCategory !== "all" 
                  ? "No documents found matching your criteria" 
                  : "No documents uploaded yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vector Storage Info */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold mb-2">AI Knowledge Base Status</h4>
            <p className="text-sm opacity-90">Vector embeddings stored for intelligent document search</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold mb-1">{totalVectors.toLocaleString()}</p>
            <p className="text-sm opacity-90">vectors</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <div>
                <p className="opacity-75">Documents</p>
                <p className="font-bold text-lg">{totalDocuments}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <div>
                <p className="opacity-75">Avg. Response</p>
                <p className="font-bold text-lg">0.8s</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <div>
                <p className="opacity-75">Accuracy</p>
                <p className="font-bold text-lg">96%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
