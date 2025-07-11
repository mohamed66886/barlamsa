import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Performance = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">تتبع الأداء</h1>
        <p className="text-muted-foreground">تقارير وإحصائيات أداء المحل والحلاقين</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قريباً</CardTitle>
          <CardDescription>ستتوفر تقارير الأداء المفصلة قريباً</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            هذه الصفحة قيد التطوير
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Performance;