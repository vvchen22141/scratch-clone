x = 0:0.1:4.5;           % time in seconds
y0 = 100;                % initial height
v0 = 0;                  % initial velocity
g = 9.8;                 % gravity

y = y0 + v0 * x - 0.5 * g * x.^2;
y(y < 0) = 0;            % Cut off at ground level

plot(x, y, 'b-', 'LineWidth', 2);
title('Ball Falling with Gravity');
xlabel('time (s)');
ylabel('position (y)');
hold on;
yline(0, 'k--');
hold off;
saveas(gcf, fullfile('public', 'plot.png'));
waitfor(gcf);

%run with matlab -batch "test_plot"